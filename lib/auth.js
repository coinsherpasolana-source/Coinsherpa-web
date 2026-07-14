// ============================================================================
// CỔNG CHỜ — ĐĂNG NHẬP / BẢO VỆ TÀI KHOẢN NGƯỜI DÙNG
// ============================================================================
// Nguồn đã chọn: Supabase Auth (đã chuẩn bị SUPABASE_URL/SUPABASE_ANON_KEY
// trong .env.example từ buổi trước) — chưa có tài khoản/key thật.
//
// Khi triển khai thật, chỉ cần viết lại NỘI DUNG 4 hàm dưới đây bằng
// @supabase/supabase-js — mọi nơi gọi các hàm này (trang login, trang cần
// đăng nhập mới xem được...) không cần sửa gì.

async function signUp(email, password) {
  return { success: false, reason: 'Chưa triển khai — cần cấu hình Supabase' };
}

async function signIn(email, password) {
  return { success: false, reason: 'Chưa triển khai — cần cấu hình Supabase' };
}

async function signOut() {
  return { success: false, reason: 'Chưa triển khai — cần cấu hình Supabase' };
}

async function getSession() {
  return { user: null, reason: 'Chưa triển khai — cần cấu hình Supabase' };
}

module.exports = { signUp, signIn, signOut, getSession };
