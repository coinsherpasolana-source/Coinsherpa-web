// Module logic nghiệp vụ Watchlist — thuần túy, không phụ thuộc database, test
// được ngay không cần Supabase. Lớp lưu trữ thật (watchlistStore.js) sẽ dùng
// lại các hàm này để kiểm tra hợp lệ trước khi ghi vào database.

// ---- Phân loại tên thư mục để sắp xếp: chữ cái -> số -> ký tự đặc biệt/icon ----
function classifyFirstChar(str) {
  const ch = (str || '').trim().charAt(0);
  if (/\p{L}/u.test(ch)) return 0; // mọi chữ cái Unicode, gồm tiếng Việt có dấu
  if (/[0-9]/.test(ch)) return 1;
  return 2; // ký tự đặc biệt, icon, emoji
}

function sortFolders(folders) {
  return [...folders].sort((a, b) => {
    const classA = classifyFirstChar(a.name);
    const classB = classifyFirstChar(b.name);
    if (classA !== classB) return classA - classB;

    if (classA === 0) {
      return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
    }
    if (classA === 1) {
      // So sánh theo giá trị số thật (2 < 10 < 100), không phải so sánh chuỗi
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    }
    return a.name.localeCompare(b.name);
  });
}

// ---- Đặt tên thư mục — người dùng toàn quyền đặt (chain, tên yêu thích, icon...) ----
function validateFolderName(name) {
  const trimmed = (name || '').trim();
  if (trimmed.length === 0) return { valid: false, reason: 'Tên thư mục không được để trống' };
  if (trimmed.length > 50) return { valid: false, reason: 'Tên thư mục tối đa 50 ký tự' };
  return { valid: true, name: trimmed };
}

// ---- Giới hạn 100 coin/thư mục ----
const MAX_COINS_PER_FOLDER = 100;

function canAddCoin(folder, mint) {
  if (folder.coins.includes(mint)) {
    return { allowed: false, reason: 'Coin đã có trong thư mục này' };
  }
  if (folder.coins.length >= MAX_COINS_PER_FOLDER) {
    return { allowed: false, reason: `Thư mục đã đủ ${MAX_COINS_PER_FOLDER} coin, giới hạn tối đa` };
  }
  return { allowed: true };
}

module.exports = { classifyFirstChar, sortFolders, validateFolderName, canAddCoin, MAX_COINS_PER_FOLDER };
