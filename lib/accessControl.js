// Module Phân quyền — quyết định tính năng nào công khai, tính năng nào cần đăng
// nhập, tính năng nào cần thêm VIP. Đúng chính sách đã thống nhất:
//   - Thông tin CƠ BẢN (giá, chart, FDV, mcap, volume, trending, bảo mật cơ bản):
//     KHÔNG có trong registry này -> mặc định công khai, ai cũng xem được.
//   - Ví Dev, KOL, Watchlist, Swap: cần đăng nhập (chưa cần VIP).
//   - Chỉ báo VIP trên chart: cần đăng nhập VÀ có gói VIP.
//
// Thêm tính năng cần khóa mới sau này chỉ cần thêm 1 dòng vào GATED_FEATURES,
// không cần sửa logic checkAccess.

const GATED_FEATURES = {
  devWallet: { requiresAuth: true, label: 'Thông tin ví Dev' },
  kolInfo: { requiresAuth: true, label: 'Thông tin KOL' },
  watchlist: { requiresAuth: true, label: 'Danh sách theo dõi' },
  swap: { requiresAuth: true, label: 'Mua bán token' },
  vipIndicators: { requiresAuth: true, requiresVip: true, label: 'Chỉ báo VIP' },
};

function checkAccess(session, featureName) {
  const feature = GATED_FEATURES[featureName];
  if (!feature) return { allowed: true }; // không nằm trong danh sách khóa -> công khai mặc định

  if (feature.requiresAuth && !session?.user) {
    return { allowed: false, reason: `Đăng nhập để xem ${feature.label}` };
  }
  if (feature.requiresVip && !session?.user?.isVip) {
    return { allowed: false, reason: `Nâng cấp VIP để xem ${feature.label}` };
  }
  return { allowed: true };
}

module.exports = { GATED_FEATURES, checkAccess };
