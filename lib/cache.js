// Module cache dùng chung cho mọi API route — mục tiêu: nhiều người cùng xem
// 1 token trong thời gian ngắn thì chỉ gọi Helius/Dexscreener/RugCheck/GeckoTerminal
// 1 LẦN, những người sau lấy lại dữ liệu đã lưu, không tốn thêm request/tiền.
//
// KIẾN TRÚC "CỔNG CHỜ": interface bên dưới (getCache/setCache) không đổi dù sau này
// đổi backend từ bộ nhớ tạm sang Upstash Redis — chỉ cần sửa NỘI DUNG bên trong
// 2 hàm này, mọi nơi khác trong dự án gọi cache không cần sửa gì.
//
// GIỚI HẠN CẦN BIẾT: giống hệt giới hạn đã ghi trong lib/security.js — bộ nhớ tạm
// (Map) trên Vercel serverless KHÔNG bền vững qua nhiều lần gọi khác instance.
// Đây là bản "giảm nhẹ tạm thời", để nâng cấp thật cần Upstash Redis (có gói miễn phí).

// ============================================================================
// NÂNG CẤP SAU NÀY: khi cần cache bền vững thật (qua mọi Vercel instance),
// đổi 4 dòng bên dưới (setCache/getCache) sang gọi Upstash Redis REST API,
// dùng 2 biến môi trường đã chuẩn bị sẵn trong .env.example:
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// Mọi nơi khác trong dự án gọi cached()/getCache()/setCache() KHÔNG cần sửa gì
// — đây chính là lợi ích của kiến trúc "cổng chờ" đã thống nhất.
// ============================================================================

const store = new Map();

function setCache(key, value, ttlSeconds) {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

// Hàm tiện ích: "lấy từ cache, nếu không có thì tự gọi hàm fetchFn rồi lưu lại"
// Dùng hàm này thay vì gọi getCache/setCache tay đôi ở mọi nơi, tránh viết lặp code.
async function cached(key, ttlSeconds, fetchFn) {
  const existing = getCache(key);
  if (existing !== null) return existing;

  const fresh = await fetchFn();
  setCache(key, fresh, ttlSeconds);
  return fresh;
}

module.exports = { getCache, setCache, cached };
