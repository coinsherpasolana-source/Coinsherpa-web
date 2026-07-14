// Tích hợp RugCheck.xyz — KHÔNG tự xây mô phỏng honeypot, dùng lại kết quả
// đã được RugCheck kiểm định (họ chuyên làm việc này).
//
// LƯU Ý QUAN TRỌNG: cấu trúc response chính xác của RugCheck chưa được xác minh
// bằng dữ liệu thật (sandbox này không có key/mạng để test trực tiếp). Hàm dưới
// đọc các field một cách phòng thủ (optional chaining) — khi bạn có API key thật,
// cần đối chiếu lại với response thật và điều chỉnh tên field nếu cần.

async function getAuditModule(mint) {
  const apiKey = process.env.RUGCHECK_API_KEY; // để trống nếu RugCheck cho phép truy cập công khai giới hạn

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mint}/report`, { headers });

    if (!res.ok) {
      return { status: 'unavailable', reason: `RugCheck trả về lỗi HTTP ${res.status}` };
    }

    const data = await res.json();

    // Đọc phòng thủ — RugCheck thường trả về danh sách "risks" và điểm số tổng.
    // Chưa chắc chắn 100% tên field, cần đối chiếu lại khi có dữ liệu thật.
    const risks = Array.isArray(data.risks) ? data.risks : [];
    const hasCriticalRisk = risks.some(
      (r) => r?.level === 'danger' || r?.level === 'critical' || r?.score >= 3
    );

    return {
      status: hasCriticalRisk ? 'danger' : risks.length > 0 ? 'caution' : 'safe',
      risksFound: risks.length,
      raw: data, // giữ nguyên dữ liệu gốc để debug/đối chiếu khi có key thật
    };
  } catch (err) {
    return { status: 'unavailable', reason: err.message };
  }
}

module.exports = { getAuditModule };
