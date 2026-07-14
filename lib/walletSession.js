// Module Phiên kết nối ví — người dùng TOÀN QUYỀN quyết định:
// - Tự động ngắt sau 1h / 2h / 3h / 12h / 24h, HOẶC
// - 'manual': không bao giờ tự ngắt, chỉ người dùng tự bấm ngắt khi muốn
//
// Đây là logic THUẦN TÚY, chạy được cả client lẫn server, không phụ thuộc
// thư viện ví (Wallet Adapter) — khi nối ví thật, chỉ cần gọi disconnect()
// của ví tại đúng thời điểm isSessionExpired() trả về true.

const DURATION_OPTIONS = {
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  manual: null, // không bao giờ tự ngắt
};

const DURATION_LABELS = {
  '1h': '1 giờ',
  '2h': '2 giờ',
  '3h': '3 giờ',
  '12h': '12 giờ',
  '24h': '24 giờ',
  manual: 'Không tự động — tôi tự ngắt khi cần',
};

// Mặc định an toàn cho người mới (có thể đổi bất cứ lúc nào trong Cài đặt) —
// không mặc định "manual" để tránh trường hợp quên ngắt trên thiết bị dùng chung.
const DEFAULT_DURATION = '12h';

function computeExpiryTimestamp(connectedAt, durationKey) {
  const ms = DURATION_OPTIONS[durationKey];
  if (ms === null || ms === undefined) return null; // 'manual' hoặc key không hợp lệ -> an toàn mặc định là không tự ngắt
  return connectedAt + ms;
}

function isSessionExpired(connectedAt, durationKey, now = Date.now()) {
  const expiry = computeExpiryTimestamp(connectedAt, durationKey);
  if (expiry === null) return false;
  return now >= expiry;
}

function getRemainingMs(connectedAt, durationKey, now = Date.now()) {
  const expiry = computeExpiryTimestamp(connectedAt, durationKey);
  if (expiry === null) return null; // không áp dụng cho chế độ manual
  return Math.max(0, expiry - now);
}

module.exports = {
  DURATION_OPTIONS,
  DURATION_LABELS,
  DEFAULT_DURATION,
  computeExpiryTimestamp,
  isSessionExpired,
  getRemainingMs,
};
