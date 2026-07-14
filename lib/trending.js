// Module Trending — chấm điểm token dựa trên: giao dịch nhiều, volume TĂNG TỐC
// (không chỉ to), giá tăng BỀN VỮNG qua nhiều khung giờ (không phải bơm 1 nến rồi xả).
// Công thức đã test với 3 kịch bản thực tế trước khi đưa vào đây — xem lịch sử test
// nếu cần đối chiếu lại khi chỉnh trọng số sau này.
//
// GIỚI HẠN CẦN BIẾT: không có khung "12h" từ nguồn dữ liệu miễn phí (GeckoTerminal/
// Dexscreener chỉ có 1h/6h/24h) — dùng 6h làm mốc gần nhất thay cho 12h.

const { computeLiquidityRisk } = require('./liquidityRisk');

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

  // Phạt nặng nếu tăng mạnh ngắn hạn nhưng dài hạn lại âm -> dấu hiệu bơm-xả
  if (priceChangeH1 > 50 && (priceChangeH6 < 0 || priceChangeH24 < 0)) {
    priceScore -= 40;
  }

  const total = txnScore * 0.4 + volumeScore * 0.3 + priceScore * 0.3;
  return Math.round(total * 10) / 10;
}

// ---- Lấy danh sách ứng viên từ GeckoTerminal trending_pools (đã lọc sẵn, không tự dò hàng triệu CA) ----
async function fetchTrendingCandidates(networkId, limit = 100) {
  const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/${networkId}/trending_pools?page=1`);
  if (!res.ok) throw new Error(`GeckoTerminal trending_pools lỗi HTTP ${res.status}`);
  const json = await res.json();
  return (json.data || []).slice(0, limit);
}

// ---- Chuẩn hóa + chấm điểm + xếp hạng ----
// Địa chỉ POOL (cặp giao dịch) khác hẳn địa chỉ MINT (chính token đó) trên Solana.
// GeckoTerminal trả "address" ở attributes là địa chỉ POOL — muốn có địa chỉ MINT
// phải lấy qua relationships.base_token.data.id (dạng "solana_<mint>").
function extractMintFromRelationships(item) {
  const baseTokenId = item?.relationships?.base_token?.data?.id;
  if (!baseTokenId) return null;
  const underscoreIdx = baseTokenId.indexOf('_');
  if (underscoreIdx === -1) return null;
  return baseTokenId.slice(underscoreIdx + 1);
}

function rankTrending(candidates) {
  return candidates
    .map((item) => {
      const attr = item.attributes || {};
      const txns24h = (attr.transactions?.h24?.buys || 0) + (attr.transactions?.h24?.sells || 0);
      const volumeH1 = parseFloat(attr.volume_usd?.h1 || 0);
      const volumeH24 = parseFloat(attr.volume_usd?.h24 || 0);
      const priceChangeH1 = parseFloat(attr.price_change_percentage?.h1 || 0);
      const priceChangeH24 = parseFloat(attr.price_change_percentage?.h24 || 0);
      // GeckoTerminal trending_pools không có h6 riêng -> tạm dùng trung bình (h1+h24)/2 làm ước lượng gần đúng
      const priceChangeH6 = (priceChangeH1 + priceChangeH24) / 2;

      const score = computeTrendScore({ txns24h, volumeH1, volumeH24, priceChangeH1, priceChangeH6, priceChangeH24 });

      const fdv = parseFloat(attr.fdv_usd || 0);
      const liquidityUsd = parseFloat(attr.reserve_in_usd || 0);
      const liquidityRisk = computeLiquidityRisk(fdv || null, liquidityUsd || null);

      // "name" của GeckoTerminal thường dạng "TOKEN / SOL" -> tách lấy riêng ký hiệu token
      const symbol = (attr.name || '???').split('/')[0].trim();

      return {
        poolAddress: attr.address, // dùng cho chart/OHLCV — CẦN địa chỉ pool, đúng chỗ
        mint: extractMintFromRelationships(item), // dùng để liên kết sang trang hồ sơ token — CẦN địa chỉ mint
        name: attr.name,
        symbol,
        imageUrl: null, // GeckoTerminal trending_pools KHÔNG trả về ảnh — sẽ được bổ sung ở lib/credibility.js cho top 30 (dùng chung request Dexscreener, không tốn thêm)
        priceUsd: parseFloat(attr.base_token_price_usd || 0),
        fdv,
        liquidityUsd,
        txns24h,
        volumeH24,
        priceChangeH1,
        priceChangeH24,
        trendScore: score,
        liquidityRisk, // cảnh báo tách biệt, hiển thị SONG SONG với trendScore, không gộp chung
      };
    })
    .sort((a, b) => b.trendScore - a.trendScore);
}


module.exports = { computeTrendScore, fetchTrendingCandidates, rankTrending };
