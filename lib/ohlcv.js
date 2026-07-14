// Lấy dữ liệu nến (OHLCV) thật từ GeckoTerminal — miễn phí, không cần API key.
// Giới hạn đã biết: chỉ hỗ trợ khung phút (1/5/15), giờ (1/4/12), ngày (1).
// Khung "3 ngày/7 ngày/30 ngày..." dùng lại khung ngày, chỉ khác số lượng nến trả về.

const TIMEFRAME_MAP = {
  '1m':  { timeframe: 'minute', aggregate: 1 },
  '5m':  { timeframe: 'minute', aggregate: 5 },
  '15m': { timeframe: 'minute', aggregate: 15 },
  '1h':  { timeframe: 'hour', aggregate: 1 },
  '4h':  { timeframe: 'hour', aggregate: 4 },
  '12h': { timeframe: 'hour', aggregate: 12 },
  '1d':  { timeframe: 'day', aggregate: 1 },
  '3d':  { timeframe: 'day', aggregate: 1 }, // lấy nhiều nến ngày hơn, không phải khung riêng
  '7d':  { timeframe: 'day', aggregate: 1 },
  '30d': { timeframe: 'day', aggregate: 1 },
  '3mo': { timeframe: 'day', aggregate: 1 },
  '6mo': { timeframe: 'day', aggregate: 1 },
  '12mo':{ timeframe: 'day', aggregate: 1 },
  'all': { timeframe: 'day', aggregate: 1 },
};

// Giới hạn số nến trả về theo từng khung — quyết định "nhìn xa bao nhiêu"
const LIMIT_MAP = {
  '1m': 300, '5m': 300, '15m': 300, '1h': 300, '4h': 300, '12h': 300,
  '1d': 30, '3d': 90, '7d': 200, '30d': 300, '3mo': 300, '6mo': 300, '12mo': 300, 'all': 1000,
};

function resolveTimeframeParams(uiTimeframe) {
  return TIMEFRAME_MAP[uiTimeframe] || TIMEFRAME_MAP['1h'];
}

function resolveLimit(uiTimeframe) {
  return LIMIT_MAP[uiTimeframe] || 300;
}

const { cached } = require('./cache');

// TTL cache theo khung giờ — khung càng ngắn, nến càng hay đổi, cache càng ngắn.
// Khung dài (ngày/tháng) gần như không đổi trong vài phút, cache lâu hơn nhiều.
const CACHE_TTL_MAP = {
  '1m': 15, '5m': 30, '15m': 60, '1h': 120, '4h': 300, '12h': 300,
  '1d': 600, '3d': 600, '7d': 600, '30d': 1800, '3mo': 1800, '6mo': 3600, '12mo': 3600, 'all': 3600,
};

async function getOhlcv(networkId, poolAddress, uiTimeframe) {
  const ttl = CACHE_TTL_MAP[uiTimeframe] || 60;
  const cacheKey = `ohlcv:${networkId}:${poolAddress}:${uiTimeframe}`;

  return cached(cacheKey, ttl, async () => {
    const { timeframe, aggregate } = resolveTimeframeParams(uiTimeframe);
    const limit = resolveLimit(uiTimeframe);

    const url = `https://api.geckoterminal.com/api/v2/networks/${networkId}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}&currency=usd`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GeckoTerminal trả về lỗi HTTP ${res.status}`);

    const json = await res.json();
    const rows = json?.data?.attributes?.ohlcv_list || [];

    return rows
      .map((r) => ({ time: r[0], open: r[1], high: r[2], low: r[3], close: r[4], volume: r[5] }))
      .sort((a, b) => a.time - b.time);
  });
}

module.exports = { getOhlcv, resolveTimeframeParams, resolveLimit, TIMEFRAME_MAP };
