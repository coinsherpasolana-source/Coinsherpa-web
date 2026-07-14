// Module "Hồ sơ Token" — lõi trung tâm của toàn bộ nền tảng.
// Chạy PHÍA SERVER (trong pages/api), không bao giờ chạy trên trình duyệt,
// nên API key Helius luôn được giữ bí mật.
//
// Trả về 1 object gồm nhiều "module con" độc lập — thêm module mới sau này
// (smart money, cá voi...) chỉ cần thêm 1 hàm mới, không đụng vào các hàm đã có.

const { getChain } = require('./chains');
const { getLaunchpad } = require('./launchpads');
const { getAuditModule } = require('./rugcheck');
const { cached } = require('./cache');
const { computeLiquidityRisk } = require('./liquidityRisk');

function heliusRpcUrl() {
  const key = process.env.HELIUS_API_KEY;
  if (!key) throw new Error('Thiếu HELIUS_API_KEY trong biến môi trường server');
  return `https://mainnet.helius-rpc.com/?api-key=${key}`;
}

async function heliusRpc(method, params) {
  const res = await fetch(heliusRpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'coinsherpa', method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'Lỗi Helius RPC');
  return json.result;
}

// ---- Module con: Bảo mật (mint/freeze authority) ----
async function getSecurityModule(mint) {
  const mintInfoRaw = await heliusRpc('getAccountInfo', [mint, { encoding: 'jsonParsed' }]);
  const info = mintInfoRaw?.value?.data?.parsed?.info;
  if (!info) return null;

  const decimals = info.decimals;
  const totalSupply = parseFloat(info.supply) / Math.pow(10, decimals);
  const mintOpen = info.mintAuthority !== null;
  const freezeOpen = info.freezeAuthority !== null;

  return {
    totalSupply,
    mintAuthorityOpen: mintOpen,
    mintAuthorityAddress: info.mintAuthority || null,
    freezeAuthorityOpen: freezeOpen,
    riskLevel: mintOpen || freezeOpen ? 'danger' : 'safe',
  };
}

// ---- Module con: Thị trường (giá, FDV, cap, đa khung giờ, launchpad, thời gian tạo) ----
async function getMarketModule(mint, chain) {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
  const data = await res.json();
  const pairs = (data.pairs || []).filter(
    (p) => p.chainId === chain.dexscreenerId && p.liquidity && p.liquidity.usd
  );
  if (pairs.length === 0) return null;

  const best = pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
  return {
    symbol: best.baseToken?.symbol || '???',
    priceUsd: best.priceUsd ? parseFloat(best.priceUsd) : null,
    fdv: best.fdv ?? null,
    marketCap: best.marketCap ?? null,
    liquidityUsd: best.liquidity.usd,
    pairAddress: best.pairAddress,
    pairCreatedAt: best.pairCreatedAt ?? null,
    priceChange: best.priceChange || {},
    txns: best.txns || {},
    volume: best.volume || {},
    launchpad: getLaunchpad(best.dexId),
    dexIdRaw: best.dexId || null, // giữ lại giá trị gốc để debug khi launchpad chưa nhận diện được
  };
}

// ---- Module con: Ticker trùng tên — tìm các token khác cùng ký hiệu ----
// LƯU Ý GIỚI HẠN: chỉ tìm được trong phạm vi Dexscreener index được qua tìm kiếm
// từ khóa, KHÔNG đảm bảo đầy đủ 100% lịch sử mint trên toàn mạng.
async function getDuplicateTickerModule(symbol, chain, currentPairAddress) {
  if (!symbol || symbol === '???') return null;

  const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol)}`);
  const data = await res.json();

  const sameSymbol = (data.pairs || [])
    .filter(
      (p) =>
        p.chainId === chain.dexscreenerId &&
        p.baseToken?.symbol?.toLowerCase() === symbol.toLowerCase() &&
        p.pairCreatedAt
    )
    .sort((a, b) => a.pairCreatedAt - b.pairCreatedAt);

  if (sameSymbol.length === 0) return null;

  const currentIndex = sameSymbol.findIndex((p) => p.pairAddress === currentPairAddress);

  return {
    totalCount: sameSymbol.length,
    currentOccurrence: currentIndex >= 0 ? currentIndex + 1 : null,
    isDataComplete: false, // luôn false — nhắc hệ thống UI hiển thị cảnh báo giới hạn dữ liệu
    list: sameSymbol.map((p, i) => ({
      pairAddress: p.pairAddress,
      mint: p.baseToken.address,
      createdAt: p.pairCreatedAt,
      occurrence: i + 1,
      isCurrent: p.pairAddress === currentPairAddress,
      liquidityUsd: p.liquidity?.usd ?? null,
    })),
  };
}

// ---- Module con: Holder (top ví lớn nhất) ----
async function getHolderModule(mint, totalSupply) {
  const largest = await heliusRpc('getTokenLargestAccounts', [mint]);
  if (!largest || !largest.value || largest.value.length === 0 || !totalSupply) return null;

  const top10 = largest.value.slice(0, 10);
  const top10Sum = top10.reduce((s, a) => s + parseFloat(a.uiAmount || 0), 0);
  const pct = Math.round((top10Sum / totalSupply) * 1000) / 10;

  return {
    top10HolderPct: pct,
    riskLevel: pct > 50 ? 'danger' : pct > 25 ? 'caution' : 'safe',
  };
}

// ---- Module con: Hoạt động — kiểm tra token có "im lặng" quá 12h không ----
// Dùng giao dịch thật cuối cùng trên pool (chính xác hơn suy đoán từ khung giờ có sẵn).
async function getActivityModule(pairAddress) {
  if (!pairAddress) return { isStale: null, hoursSinceLastTx: null };
  try {
    const sigs = await heliusRpc('getSignaturesForAddress', [pairAddress, { limit: 1 }]);
    const lastTx = sigs && sigs[0];
    if (!lastTx || !lastTx.blockTime) return { isStale: null, hoursSinceLastTx: null };
    const hoursSince = (Date.now() / 1000 - lastTx.blockTime) / 3600;
    return {
      isStale: hoursSince >= 12,
      hoursSinceLastTx: Math.round(hoursSince * 10) / 10,
    };
  } catch {
    return { isStale: null, hoursSinceLastTx: null }; // lỗi mạng -> không tự ý ẩn oan
  }
}

// ---- Hàm tổng hợp: gọi song song tất cả module, ghép thành 1 hồ sơ ----
// Mỗi module con có Ô CACHE RIÊNG với TTL (thời gian sống) khác nhau — đúng tinh
// thần "mỗi module 1 mục database riêng": giá thay đổi nhanh nên cache ngắn (15s),
// mint/freeze authority gần như không đổi nên cache dài (5 phút), v.v.
async function buildTokenProfile(mint, chainId = 'solana', options = {}) {
  const { includeDevWallet = true } = options; // mặc định true để không phá code cũ đang gọi hàm này

  const chain = getChain(chainId);
  if (!chain) throw new Error(`Chain không được hỗ trợ: ${chainId}`);

  const [security, market] = await Promise.all([
    cached(`security:${mint}`, 300, () => getSecurityModule(mint)).catch(() => null),
    cached(`market:${mint}:${chainId}`, 15, () => getMarketModule(mint, chain)).catch(() => null),
  ]);

  const holder = security
    ? await cached(`holder:${mint}`, 60, () => getHolderModule(mint, security.totalSupply)).catch(() => null)
    : null;

  const duplicateTickers = market
    ? await cached(`dup:${market.symbol}:${chainId}:${market.pairAddress}`, 300, () =>
        getDuplicateTickerModule(market.symbol, chain, market.pairAddress)
      ).catch(() => null)
    : null;

  const activity = market?.pairAddress
    ? await cached(`activity:${market.pairAddress}`, 60, () => getActivityModule(market.pairAddress)).catch(
        () => ({ isStale: null, hoursSinceLastTx: null })
      )
    : { isStale: null, hoursSinceLastTx: null };

  const audit = await cached(`audit:${mint}`, 600, () => getAuditModule(mint)).catch(() => ({
    status: 'unavailable',
    reason: 'Lỗi không xác định',
  }));

  // CHẶN TỪ TRƯỚC khi gọi Helius nếu người dùng chưa được phép xem — tiết kiệm
  // tiền thật, không tính rồi mới giấu kết quả.
  const devWalletInfo = includeDevWallet
    ? await cached(`devwallet:${mint}`, 300, () => getDevWalletModule(security)).catch(() => ({
        devWallet: null,
        reason: 'Lỗi không xác định',
      }))
    : { locked: true, reason: 'Đăng nhập để xem thông tin ví Dev' };

  // Không cần gọi API riêng — tính trực tiếp từ market.marketCap và market.liquidityUsd đã có sẵn
  const liquidityRisk = market
    ? computeLiquidityRisk(market.marketCap, market.liquidityUsd)
    : { ratio: null, level: 'unknown', label: 'Không xác định' };

  return {
    mint,
    chain: chain.id,
    security,
    market,
    holder,
    duplicateTickers,
    activity,
    audit,
    devWalletInfo,
    liquidityRisk,
    // Module dành cho tương lai — chưa có dữ liệu, để sẵn chỗ trong cấu trúc
    smartMoney: null,
    whaleActivity: null,
  };
}

// ---- Module con: Ví Dev — ai tạo token này, họ từng tạo bao nhiêu token khác ----
// GIỚI HẠN CẦN BIẾT: nếu mint authority đã bị renounce (đóng), không còn cách nào
// đáng tin để xác định CHẮC CHẮN ví dev ban đầu chỉ bằng 1 lệnh gọi — trường hợp
// này trả về "không xác định được" thay vì đoán mò.
async function getDevWalletModule(security) {
  if (!security || !security.mintAuthorityOpen) {
    return { devWallet: null, reason: 'Mint authority đã đóng — không xác định chắc chắn được ví dev ban đầu' };
  }

  const devWallet = security.mintAuthorityAddress;
  if (!devWallet) {
    return { devWallet: null, reason: 'Không có địa chỉ ví dev' };
  }

  try {
    const assets = await heliusRpc('getAssetsByAuthority', { authorityAddress: devWallet, page: 1, limit: 50 });
    const items = assets?.items || [];
    const tokenList = items
      .filter((a) => a.interface === 'FungibleToken' || a.interface === 'FungibleAsset')
      .map((a) => ({
        mint: a.id,
        symbol: a.token_info?.symbol || a.content?.metadata?.symbol || '???',
        name: a.content?.metadata?.name || null,
      }));

    return {
      devWallet,
      totalTokensCreated: tokenList.length,
      tokenList,
      isDataComplete: false, // getAssetsByAuthority có thể không bắt hết mọi trường hợp lịch sử
    };
  } catch (err) {
    return { devWallet, reason: `Lỗi khi tra cứu: ${err.message}` };
  }
}

module.exports = { buildTokenProfile };
