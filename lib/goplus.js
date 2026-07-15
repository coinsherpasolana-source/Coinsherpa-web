// Tích hợp GoPlus Security — nguồn audit THỨ 2, chạy SONG SONG với RugCheck
// (không thay thế, mà bổ sung — 2 nguồn độc lập cùng kiểm tra 1 token, đúng
// tinh thần "Parallel Audit Race" trong hồ sơ kỹ thuật, nhưng ưu tiên AN TOÀN
// thay vì "ai trả lời nhanh nhất thắng" — xem mergeAuditResults()).
//
// LƯU Ý: giống RugCheck, cấu trúc response GoPlus chưa được xác minh bằng dữ
// liệu thật (sandbox không có mạng). Đọc phòng thủ, cần đối chiếu khi có key/mạng thật.

async function getGoPlusAudit(mint) {
  try {
    const res = await fetch(
      `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${mint}`
    );

    if (!res.ok) {
      return { status: 'unavailable', reason: `GoPlus trả về lỗi HTTP ${res.status}` };
    }

    const data = await res.json();
    const tokenData = data?.result?.[mint];
    if (!tokenData) {
      return { status: 'unavailable', reason: 'GoPlus không có dữ liệu cho token này' };
    }

    // Đọc phòng thủ các cờ rủi ro phổ biến của GoPlus (mint/freeze authority,
    // honeypot...) — cần đối chiếu tên field chính xác khi có dữ liệu thật.
    const dangerFlags = [
      tokenData.mintable?.status === '1',
      tokenData.freezable?.status === '1',
      tokenData.is_honeypot === '1',
    ].filter(Boolean).length;

    return {
      status: dangerFlags > 0 ? 'danger' : 'safe',
      reason: dangerFlags > 0 ? 'GoPlus phát hiện quyền mint/freeze/honeypot còn mở' : null,
      raw: tokenData,
    };
  } catch (err) {
    return { status: 'unavailable', reason: err.message };
  }
}

module.exports = { getGoPlusAudit };
