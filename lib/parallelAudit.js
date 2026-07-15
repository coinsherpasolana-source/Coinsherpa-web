// "Đua song song" 2 nguồn audit (RugCheck + GoPlus) — nhưng KHÁC với nghĩa đen
// "ai nhanh nhất thắng" trong hồ sơ gốc: ở đây ƯU TIÊN AN TOÀN — chỉ cần 1
// trong 2 nguồn báo nguy hiểm là kết luận nguy hiểm ngay, không chờ đồng thuận.
// Lý do: với 1 nền tảng bảo vệ người mới, bỏ sót 1 cảnh báo thật nguy hiểm hơn
// nhiều so với hiện thừa 1 cảnh báo không cần thiết.

const { getAuditModule } = require('./rugcheck');
const { getGoPlusAudit } = require('./goplus');

function mergeAuditResults(rugcheckResult, goplusResult) {
  const sources = [rugcheckResult, goplusResult].filter((r) => r && r.status !== 'unavailable');

  if (sources.length === 0) {
    return { status: 'unavailable', reason: 'Cả 2 nguồn audit đều không phản hồi' };
  }

  const dangerSource = sources.find((r) => r.status === 'danger');
  if (dangerSource) {
    return { status: 'danger', reason: dangerSource.reason || 'Phát hiện rủi ro', sourceCount: sources.length };
  }

  const hasCaution = sources.some((r) => r.status === 'caution');
  if (hasCaution) {
    return { status: 'caution', reason: 'Có dấu hiệu cần thận trọng', sourceCount: sources.length };
  }

  return { status: 'safe', sourceCount: sources.length };
}

async function runParallelAudit(mint) {
  const [rugcheckResult, goplusResult] = await Promise.all([
    getAuditModule(mint).catch(() => ({ status: 'unavailable', reason: 'Lỗi RugCheck' })),
    getGoPlusAudit(mint).catch(() => ({ status: 'unavailable', reason: 'Lỗi GoPlus' })),
  ]);

  return mergeAuditResults(rugcheckResult, goplusResult);
}

module.exports = { runParallelAudit, mergeAuditResults };
