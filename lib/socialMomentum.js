// ============================================================================
// CỔNG CHỜ — HOT TRENDING (momentum mạng xã hội tăng đột biến)
// ============================================================================
// Nguồn dự kiến: LunarCrush API (có gói miễn phí).
//
// GIỚI HẠN QUAN TRỌNG CẦN BIẾT TRƯỚC KHI TRIỂN KHAI THẬT:
// LunarCrush chỉ theo dõi ~4.000 coin đã có tên tuổi — KHÔNG phủ được memecoin
// vừa mint vài phút trước, đúng đối tượng chính của Coinsherpa. Tính năng này
// chỉ có ý nghĩa với token đã có sức hút nhất định, không phải mọi CA mới.
//
// Lý do CHƯA code chức năng thật:
// 1. Cần tài khoản LunarCrush thật + API key (biến môi trường: LUNARCRUSH_API_KEY)
// 2. Phát hiện "đột biến" cần so sánh với SỐ LIỆU LỊCH SỬ (baseline trung bình) —
//    không thể tính từ 1 lần gọi API, cần lưu chuỗi thời gian vào Supabase (đã
//    chuẩn bị cổng chờ SUPABASE_URL/SUPABASE_ANON_KEY) — chưa có ở giai đoạn này.

function getSocialMomentum(symbol) {
  return {
    available: false,
    reason: 'Chưa triển khai — cần LUNARCRUSH_API_KEY và lưu trữ lịch sử qua Supabase để so sánh baseline',
  };
}

function isHotTrending(symbol) {
  return { isHot: null, reason: 'Chưa triển khai' };
}

module.exports = { getSocialMomentum, isHotTrending };
