// Danh sách memecoin Solana theo VỐN HÓA — TỰ ĐỘNG 100% qua CoinGecko, không
// cần tự tay tra địa chỉ như phiên bản trước. CoinGecko có sẵn chuyên mục chính
// thức "solana-meme-coins", xếp sẵn theo vốn hóa giảm dần.
//
// CẦN: COINGECKO_API_KEY (đăng ký miễn phí tại coingecko.com/en/api — gói Demo
// API, khác với Helius, cần đăng ký riêng).

const { cached } = require('./cache');

function normalizeCoinGeckoToken(item) {
  return {
    id: item.id, // dùng để tra địa chỉ mint SAU (chỉ khi user bấm vào, tiết kiệm request)
    symbol: (item.symbol || '???').toUpperCase(),
    name: item.name,
    priceUsd: item.current_price ?? null,
    marketCap: item.market_cap ?? null,
    fdv: item.fully_diluted_valuation ?? null,
    volumeH24: item.total_volume ?? null,
    priceChangeH24: item.price_change_percentage_24h ?? null,
    imageUrl: item.image || null,
    rank: item.market_cap_rank ?? null,
  };
}

async function fetchSolanaMemeCoinsByMarketCap(limit = 200) {
  const apiKey = process.env.COINGECKO_API_KEY;
  if (!apiKey) {
    return { tokens: [], error: 'Chưa cấu hình COINGECKO_API_KEY' };
  }

  return cached(`bluechip:coingecko:${limit}`, 300, async () => {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-meme-coins&order=market_cap_desc&per_page=${Math.min(limit, 250)}&page=1&price_change_percentage=24h`;
    const res = await fetch(url, { headers: { 'x-cg-demo-api-key': apiKey } });
    if (!res.ok) throw new Error(`CoinGecko trả về lỗi HTTP ${res.status}`);
    const json = await res.json();
    const tokens = (json || []).map(normalizeCoinGeckoToken).sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
    return { tokens, error: null };
  });
}

// Tra địa chỉ mint Solana thật CHỈ KHI người dùng bấm vào 1 token cụ thể —
// không tra trước cho cả 200 token (tiết kiệm request, đúng nguyên tắc đã theo
// suốt dự án: chỉ làm giàu dữ liệu cho đúng phần cần dùng ngay).
async function resolveSolanaMint(coinGeckoId) {
  const apiKey = process.env.COINGECKO_API_KEY;
  if (!apiKey) throw new Error('Chưa cấu hình COINGECKO_API_KEY');

  return cached(`bluechip:mint:${coinGeckoId}`, 3600, async () => {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinGeckoId}`, {
      headers: { 'x-cg-demo-api-key': apiKey },
    });
    if (!res.ok) throw new Error(`CoinGecko trả về lỗi HTTP ${res.status}`);
    const json = await res.json();
    return json.platforms?.solana || null;
  });
}

module.exports = { fetchSolanaMemeCoinsByMarketCap, resolveSolanaMint, normalizeCoinGeckoToken };
