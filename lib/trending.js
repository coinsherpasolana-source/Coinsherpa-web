// Module Trending — chấm điểm token dựa trên: giao dịch nhiều, volume TĂNG TỐC
// (không chỉ to), giá tăng BỀN VỮNG qua nhiều khung giờ (không phải bơm 1 nến rồi xả).
// Công thức đã test với 3 kịch bản thực tế trước khi đưa vào đây — xem lịch sử test
// nếu cần đối chiếu lại khi chỉnh trọng số sau này.
//
// GIỚI HẠN CẦN BIẾT: không có khung "12h" từ nguồn dữ liệu miễn phí (GeckoTerminal/
// Dexscreener chỉ có 1h/6h/24h) — dùng 6h làm mốc gần nhất thay cho 12h.

const { computeLiquidityRisk } = require('./liquidityRisk');
const { getLaunchpad } = require('./launchpads');

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function computeTrendScore({ txns24h, volumeH1, volumeH24, priceChangeH1, priceChangeH6, priceChangeH24 }) {
  const txnScore = Math.min(100, Math.log10((txns24h || 0) + 1) * 20);

  const avgHourlyVolume = (volumeH24 || 0) / 24;
  const accelerationRatio = avgHourlyVolume > 0 ? (volumeH1 || 0) / avgHourlyVolume : 0;
  const volumeScore = clamp((accelerationRatio - 1) * 30, -30, 100);

  const p1 = clamp(priceChangeH1 || 0, -50, 100);
  const p6 = clamp(priceChangeH6 || 0, -50, 100);
  const p24 = clamp(priceChangeH24 || 0, -50, 100);
  let priceScore = clamp(p1 * 0.2 + p6 * 0.35 + p24 * 0.45, -100, 100);

  if (priceChangeH1 > 50 && (priceChangeH6 < 0 || priceChangeH24 < 0)) {
    priceScore -= 40;
  }

  const total = txnScore * 0.4 + volumeScore * 0.3 + priceScore * 0.3;
  return Math.round(total * 10) / 10;
}

// GeckoTerminal chỉ trả ~20 pool/trang — gộp nhiều trang liên tiếp để đủ số lượng yêu cầu (100-200)
async function fetchMultiPage(fetchPageFn, limit, maxPages = 10) {
  let collected = [];
  let page = 1;
  while (collected.length < limit && page <= maxPages) {
    const items = await fetchPageFn(page);
    if (!items || items.length === 0) break;
    collected = collected.concat(items);
    page++;
  }
  return collected.slice(0, limit);
}

// ---- Lấy ứng viên từ 2 nguồn GeckoTerminal khác nhau tùy chế độ ----
async function fetchTrendingCandidates(networkId, limit = 100) {
  return fetchMultiPage(async (page) => {
    const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/${networkId}/trending_pools?page=${page}`);
    if (!res.ok) throw new Error(`GeckoTerminal trending_pools lỗi HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }, limit);
}

// Nguồn RIÊNG cho tab "New" — pool mới tạo, sắp theo thời gian, khác hẳn trending_pools
async function fetchNewCandidates(networkId, limit = 100) {
  return fetchMultiPage(async (page) => {
    const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/${networkId}/new_pools?page=${page}`);
    if (!res.ok) throw new Error(`GeckoTerminal new_pools lỗi HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }, limit);
}

function extractMintFromRelationships(item) {
  const baseTokenId = item?.relationships?.base_token?.data?.id;
  if (!baseTokenId) return null;
  const underscoreIdx = baseTokenId.indexOf('_');
  if (underscoreIdx === -1) return null;
  return baseTokenId.slice(underscoreIdx + 1);
}

function extractDexId(item) {
  return item?.relationships?.dex?.data?.id || null;
}

// ---- Chuẩn hóa 1 pool thô của GeckoTerminal thành object dùng chung cho cả 3 chế độ ----
function normalizeToken(item) {
  const attr = item.attributes || {};
  const txns24h = (attr.transactions?.h24?.buys || 0) + (attr.transactions?.h24?.sells || 0);
  const volumeH1 = parseFloat(attr.volume_usd?.h1 || 0);
  const volumeH24 = parseFloat(attr.volume_usd?.h24 || 0);
  const priceChangeH1 = parseFloat(attr.price_change_percentage?.h1 || 0);
  const priceChangeH24 = parseFloat(attr.price_change_percentage?.h24 || 0);
  const priceChangeH6 = (priceChangeH1 + priceChangeH24) / 2; // ước lượng, GeckoTerminal không có h6 riêng

  const score = computeTrendScore({ txns24h, volumeH1, volumeH24, priceChangeH1, priceChangeH6, priceChangeH24 });

  const fdv = parseFloat(attr.fdv_usd || 0);
  const liquidityUsd = parseFloat(attr.reserve_in_usd || 0);
  const liquidityRisk = computeLiquidityRisk(fdv || null, liquidityUsd || null);

  const symbol = (attr.name || '???').split('/')[0].trim();
  const dexId = extractDexId(item);
  const launchpad = getLaunchpad(dexId);

  const poolCreatedAt = attr.pool_created_at ? new Date(attr.pool_created_at).getTime() : null;

  return {
    poolAddress: attr.address,
    mint: extractMintFromRelationships(item),
    name: attr.name,
    symbol,
    imageUrl: null, // bổ sung sau ở lib/credibility.js cho top 30, dùng chung request Dexscreener
    priceUsd: parseFloat(attr.base_token_price_usd || 0),
    fdv,
    liquidityUsd,
    txns24h,
    volumeH24,
    priceChangeH1,
    priceChangeH24,
    poolCreatedAt,
    dexId,
    dexLabel: launchpad?.label || dexId,
    trendScore: score,
    liquidityRisk,
  };
}

// ---- Xếp hạng theo đúng chế độ: trending (điểm tổng hợp) / new (mới nhất) / top (volume hoặc txns) ----
function rankByMode(candidates, mode = 'trending', options = {}) {
  const tokens = candidates.map(normalizeToken);

  if (mode === 'new') {
    return tokens
      .filter((t) => t.poolCreatedAt !== null)
      .sort((a, b) => b.poolCreatedAt - a.poolCreatedAt);
  }

  if (mode === 'top') {
    const sortBy = options.sortBy === 'txns' ? 'txns24h' : 'volumeH24';
    return tokens.sort((a, b) => b[sortBy] - a[sortBy]);
  }

  // mặc định: trending
  return tokens.sort((a, b) => b.trendScore - a.trendScore);
}

// Giữ lại tên hàm cũ để không phá code đang gọi rankTrending() ở nơi khác
function rankTrending(candidates) {
  return rankByMode(candidates, 'trending');
}

module.exports = {
  computeTrendScore,
  fetchTrendingCandidates,
  fetchNewCandidates,
  rankTrending,
  rankByMode,
  normalizeToken,
};
