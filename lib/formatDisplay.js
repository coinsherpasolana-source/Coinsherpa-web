// Module định dạng hiển thị dùng chung cho danh sách Trending/New/Top —
// đã test kỹ từng hàm với dữ liệu mẫu thật trước khi đưa vào đây.

function formatCompactPrice(price) {
  if (price === null || price === undefined || isNaN(price) || price === 0) return { type: 'na' };
  if (price >= 1) return { type: 'normal', text: '$' + price.toFixed(2) };

  const str = price.toFixed(12);
  const afterDecimal = str.split('.')[1];
  let leadingZeros = 0;
  for (const ch of afterDecimal) {
    if (ch === '0') leadingZeros++; else break;
  }

  if (leadingZeros >= 3) {
    const digits = afterDecimal.slice(leadingZeros, leadingZeros + 4);
    return { type: 'subscript', zeros: leadingZeros, digits };
  }
  let fixed = price.toFixed(6).replace(/0+$/, '');
  if (fixed.endsWith('.')) fixed += '0';
  const decimalPart = fixed.split('.')[1] || '';
  if (decimalPart.length < 4) fixed = price.toFixed(4);
  return { type: 'normal', text: '$' + fixed };
}

function trimTrailingZero(s) {
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

function formatCompactNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n >= 1e9) return sign + '$' + trimTrailingZero((n / 1e9).toFixed(1)) + 'B';
  if (n >= 1e6) return sign + '$' + trimTrailingZero((n / 1e6).toFixed(1)) + 'M';
  if (n >= 1e3) return sign + '$' + Math.round(n / 1e3) + 'K';
  return sign + '$' + n.toFixed(0);
}

function formatAge(createdAtMs, nowMs = Date.now()) {
  if (!createdAtMs) return null;
  const diffMs = nowMs - createdAtMs;
  if (diffMs < 0) return null;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return sec + 's';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + 'm';
  const hour = Math.floor(min / 60);
  if (hour < 24) return hour + 'h';
  const day = Math.floor(hour / 24);
  return day + 'd';
}

module.exports = { formatCompactPrice, formatCompactNumber, formatAge };
