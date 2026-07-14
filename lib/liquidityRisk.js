// Module Rủi ro Thanh khoản — tỷ lệ Vốn hóa (Mcap) / Thanh khoản (Lpool).
// Đây là cảnh báo THỨ 2, TÁCH BIỆT với cảnh báo rủi ro holder/mint-freeze đã có —
// cố tình không gộp chung, để người dùng thấy rõ 2 loại rủi ro khác nhau:
// "token có an toàn về cấu trúc không" (holder/mint) vs "token có dễ trồi sụt giá không" (thanh khoản).
//
// Ngưỡng do người vận hành Coinsherpa tự quyết định dựa trên kinh nghiệm thị trường:
//   tỷ lệ <= 3   : An toàn
//   tỷ lệ 3 - 5  : Trung tính
//   tỷ lệ 5 - 10 : Dễ bay (biến động mạnh, có thể pump/dump nhiều lần quanh vùng 3-5)
//   tỷ lệ > 10   : Báo động — mạo hiểm cao, cơ hội lớn nhưng rủi ro dump sâu tương ứng

function computeLiquidityRisk(marketCap, liquidityUsd) {
  if (marketCap === null || marketCap === undefined || liquidityUsd === null || liquidityUsd === undefined) {
    return { ratio: null, level: 'unknown', label: 'Không xác định' };
  }
  if (liquidityUsd === 0) {
    return {
      ratio: null,
      level: 'danger',
      label: 'CỰC KỲ NGUY HIỂM — Thanh khoản bằng 0 (có thể đã bị rút hết)',
    };
  }

  const ratio = marketCap / liquidityUsd;
  let level, label;
  if (ratio <= 3) {
    level = 'safe';
    label = 'An toàn — thanh khoản dày so với vốn hóa';
  } else if (ratio <= 5) {
    level = 'neutral';
    label = 'Trung tính';
  } else if (ratio <= 10) {
    level = 'volatile';
    label = 'Dễ bay — biến động mạnh, có thể dump sâu về vùng tỷ lệ 3-5';
  } else {
    level = 'danger';
    label = 'Báo động — mạo hiểm cao, cơ hội lớn đi kèm rủi ro dump sâu';
  }

  return { ratio: Math.round(ratio * 100) / 100, level, label };
}

module.exports = { computeLiquidityRisk };
