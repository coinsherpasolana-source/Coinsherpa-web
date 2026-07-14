// ============================================================================
// CỔNG CHỜ — XÁC MINH KHÔNG PHẢI ROBOT
// ============================================================================
// Nguồn đã chọn: Cloudflare Turnstile — dùng lại Cloudflare đã chọn cho bảo mật
// trước đó (không thêm nhà cung cấp mới), miễn phí, thân thiện quyền riêng tư
// hơn reCAPTCHA (không cần người dùng chọn ảnh xe buýt/đèn giao thông).
//
// Cần: biến môi trường NEXT_PUBLIC_TURNSTILE_SITE_KEY (phía trình duyệt) và
// TURNSTILE_SECRET_KEY (phía server, để xác minh token) — CHƯA có tài khoản thật.

async function verifyCaptchaToken(token) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return { success: false, reason: 'Chưa cấu hình TURNSTILE_SECRET_KEY' };
  }
  // Khi có key thật, gọi: https://challenges.cloudflare.com/turnstile/v0/siteverify
  // với { secret: secretKey, response: token } — chưa triển khai ở giai đoạn này.
  return { success: false, reason: 'Chưa triển khai chức năng xác minh thật' };
}

module.exports = { verifyCaptchaToken };
