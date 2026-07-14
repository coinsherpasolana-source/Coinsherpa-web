// ============================================================================
// CỔNG CHỜ — ỐNG NGHE BLOCKCHAIN TRỰC TIẾP (chưa triển khai chức năng thật)
// ============================================================================
// Đây là bản "khai báo trước chỗ cắm" cho tính năng nến giây (1s) đã bàn ở buổi
// trước — quyết định: làm sau (giai đoạn 2), cần 1 server nền chạy 24/7 riêng
// (Railway/Render/VPS), KHÔNG chạy được trên Vercel serverless.
//
// Mục đích file này: để các module khác (ví dụ component chart) có thể ĐÃ gọi
// đúng tên hàm ngay từ bây giờ, và khi ống nghe thật được xây xong ở server
// riêng, chỉ cần thay nội dung 2 hàm dưới đây — không cần sửa bất kỳ nơi nào
// khác đang gọi tới chúng.

// subscribeToPool: đăng ký lắng nghe 1 pool cụ thể theo thời gian thực.
// Hiện tại CHƯA làm gì — chỉ trả về trạng thái rõ ràng để giao diện biết mà
// hiển thị đúng (ví dụ: ẩn nút "Nến giây", hiện "Sắp ra mắt").
function subscribeToPool(poolAddress, onCandleUpdate) {
  console.warn(`[blockchainListener] Chưa triển khai — không thể lắng nghe pool ${poolAddress}`);
  return {
    active: false,
    reason: 'Ống nghe blockchain chưa được triển khai — cần server nền riêng (giai đoạn 2)',
    unsubscribe: () => {}, // hàm rỗng, để nơi gọi không bị lỗi khi cleanup
  };
}

// getListenerStatus: cho giao diện hỏi "tính năng nến giây có sẵn sàng chưa?"
// trước khi cố hiển thị nút bấm liên quan, tránh hứa hẹn tính năng chưa có.
function getListenerStatus() {
  return {
    available: false,
    reason: 'Cần triển khai server nền riêng (Railway/Render/VPS), chưa làm ở giai đoạn hiện tại',
  };
}

module.exports = { subscribeToPool, getListenerStatus };
