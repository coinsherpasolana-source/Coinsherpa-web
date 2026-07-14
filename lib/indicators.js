// Các hàm tính chỉ báo kỹ thuật — thuần JS, chạy được cả server lẫn client.
// Mỗi hàm đã được test riêng với dữ liệu dễ kiểm chứng bằng tay trước khi đưa vào đây.

function sma(closes, period) {
  const result = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

function ema(closes, period) {
  const k = 2 / (period + 1);
  const result = Array(closes.length).fill(null);
  let prevEma = null;
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) continue;
    if (prevEma === null) {
      const slice = closes.slice(i - period + 1, i + 1);
      prevEma = slice.reduce((a, b) => a + b, 0) / period;
    } else {
      prevEma = closes[i] * k + prevEma * (1 - k);
    }
    result[i] = prevEma;
  }
  return result;
}

function rsi(closes, period = 14) {
  const result = Array(closes.length).fill(null);
  if (closes.length <= period) return result;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

function macd(closes, fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = closes.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null
  );
  const validMacd = macdLine.filter((v) => v !== null);
  const signalRaw = ema(validMacd, signalPeriod);
  const firstValidIdx = macdLine.findIndex((v) => v !== null);
  const signalLine = Array(closes.length).fill(null);
  signalRaw.forEach((v, i) => { if (v !== null) signalLine[firstValidIdx + i] = v; });
  const histogram = closes.map((_, i) =>
    macdLine[i] !== null && signalLine[i] !== null ? macdLine[i] - signalLine[i] : null
  );
  return { macdLine, signalLine, histogram };
}

function bollingerBands(closes, period = 20, stdDevMultiplier = 2) {
  const result = { upper: [], middle: [], lower: [] };
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.upper.push(null); result.middle.push(null); result.lower.push(null); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    result.upper.push(mean + stdDev * stdDevMultiplier);
    result.middle.push(mean);
    result.lower.push(mean - stdDev * stdDevMultiplier);
  }
  return result;
}

// ---- Registry chỉ báo — đúng tinh thần module hóa, thêm chỉ báo mới chỉ cần thêm 1 dòng ----
// "tier: free" = hiện cho mọi người. "tier: vip" = khóa, chỉ hiện cho gói VIP.
const INDICATOR_REGISTRY = [
  { id: 'sma20', label: 'SMA 20', tier: 'free', compute: (c) => sma(c, 20) },
  { id: 'ema20', label: 'EMA 20', tier: 'free', compute: (c) => ema(c, 20) },
  { id: 'ema50', label: 'EMA 50', tier: 'free', compute: (c) => ema(c, 50) },
  { id: 'rsi14', label: 'RSI 14', tier: 'free', compute: (c) => rsi(c, 14) },
  { id: 'macd', label: 'MACD', tier: 'free', compute: (c) => macd(c) },
  { id: 'bollinger', label: 'Bollinger Bands', tier: 'free', compute: (c) => bollingerBands(c) },
  // --- Từ đây trở xuống dành cho VIP (thêm chỉ báo mới thì đặt tier: 'vip') ---
  { id: 'ema100', label: 'EMA 100', tier: 'vip', compute: (c) => ema(c, 100) },
  { id: 'ema200', label: 'EMA 200', tier: 'vip', compute: (c) => ema(c, 200) },
  { id: 'rsi7', label: 'RSI 7 (nhanh)', tier: 'vip', compute: (c) => rsi(c, 7) },
  { id: 'sma50', label: 'SMA 50', tier: 'vip', compute: (c) => sma(c, 50) },
];

function getIndicatorsForTier(userTier = 'free') {
  return INDICATOR_REGISTRY.filter((ind) => ind.tier === 'free' || userTier === 'vip');
}

module.exports = { sma, ema, rsi, macd, bollingerBands, INDICATOR_REGISTRY, getIndicatorsForTier };
