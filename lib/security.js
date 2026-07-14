// Module bảo mật dùng chung cho các API route.
// Mục tiêu: chặn request rác/tấn công TRƯỚC KHI nó chạm tới Helius/RugCheck
// (mỗi lệnh gọi tới các dịch vụ đó đều tốn tiền thật — chặn sớm = tiết kiệm tiền thật).

function isValidSolanaAddress(str) {
  if (typeof str !== 'string') return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(str);
}

// ---- Rate limit: giới hạn số request mỗi IP trong 1 khoảng thời gian ----
// LƯU Ý QUAN TRỌNG: Vercel serverless function KHÔNG giữ bộ nhớ ổn định giữa
// các lần gọi (mỗi request có thể chạy trên 1 instance khác nhau), nên bộ đếm
// dùng Map trong bộ nhớ dưới đây CHỈ có tác dụng giảm nhẹ tạm thời, KHÔNG phải
// giải pháp chống spam triệt để. Khi có traffic thật, cần nâng cấp lên Upstash
// Redis (có gói miễn phí, tích hợp thẳng với Vercel) để đếm chính xác qua mọi instance.
const requestLog = new Map();
const WINDOW_MS = 60 * 1000; // 1 phút
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = requestLog.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > WINDOW_MS) {
    // hết cửa sổ cũ -> reset
    requestLog.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false };
  }

  entry.count += 1;
  requestLog.set(ip, entry);
  return { allowed: true };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
}

module.exports = { isValidSolanaAddress, checkRateLimit, getClientIp };
