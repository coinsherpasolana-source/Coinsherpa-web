// ============================================================================
// CỔNG CHỜ — LƯU TRỮ WATCHLIST THẬT (Supabase)
// ============================================================================
// Logic nghiệp vụ (sắp xếp, đặt tên, giới hạn 100 coin) đã xong và test kỹ ở
// lib/watchlist.js — file này CHỈ lo phần LƯU/ĐỌC dữ liệu, hiện chưa có Supabase
// thật nên mọi hàm trả về "chưa triển khai", không giả vờ lưu được.

const { validateFolderName } = require('./watchlist');

async function getFolders(userId) {
  return { folders: [], reason: 'Chưa triển khai — cần cấu hình Supabase' };
}

async function createFolder(userId, name) {
  const validation = validateFolderName(name);
  if (!validation.valid) return { success: false, reason: validation.reason };
  return { success: false, reason: 'Chưa triển khai — cần cấu hình Supabase' };
}

async function renameFolder(userId, folderId, newName) {
  const validation = validateFolderName(newName);
  if (!validation.valid) return { success: false, reason: validation.reason };
  return { success: false, reason: 'Chưa triển khai — cần cấu hình Supabase' };
}

async function addCoinToFolder(userId, folderId, mint) {
  return { success: false, reason: 'Chưa triển khai — cần cấu hình Supabase' };
}

module.exports = { getFolders, createFolder, renameFolder, addCoinToFolder };
