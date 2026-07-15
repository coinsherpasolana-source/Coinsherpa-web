// Module đọc dữ liệu THÔ trực tiếp từ blockchain Solana — dùng Helius RPC (đã có
// key sẵn), KHÔNG đi qua Dexscreener/GeckoTerminal. Đây là cách "gần nguồn nhất"
// có thể làm mà KHÔNG cần server riêng chạy 24/7 (đọc theo yêu cầu, không lắng nghe
// liên tục — muốn lắng nghe thật cần lib/blockchainListenerService — xem file đó).

function heliusRpcUrl() {
  const key = process.env.HELIUS_API_KEY;
  if (!key) throw new Error('Thiếu HELIUS_API_KEY');
  return `https://mainnet.helius-rpc.com/?api-key=${key}`;
}

async function heliusRpc(method, params) {
  const res = await fetch(heliusRpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'raw-reader', method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'Lỗi Helius RPC');
  return json.result;
}

// Solana không đánh dấu "đây là swap" — phải TỰ SUY RA bằng cách so sánh số dư
// token của từng ví TRƯỚC và SAU giao dịch (preTokenBalances/postTokenBalances).
// Đây chính là cách "đọc thô" thật sự, không qua bên tổng hợp nào.
function parseSwapFromTransaction(tx, targetMint) {
  const pre = tx.meta?.preTokenBalances || [];
  const post = tx.meta?.postTokenBalances || [];

  const preMap = new Map(
    pre.filter((b) => b.mint === targetMint).map((b) => [b.owner, parseFloat(b.uiTokenAmount.uiAmountString || 0)])
  );
  const postMap = new Map(
    post.filter((b) => b.mint === targetMint).map((b) => [b.owner, parseFloat(b.uiTokenAmount.uiAmountString || 0)])
  );

  const owners = new Set([...preMap.keys(), ...postMap.keys()]);
  const changes = [];
  for (const owner of owners) {
    const before = preMap.get(owner) || 0;
    const after = postMap.get(owner) || 0;
    const diff = after - before;
    if (Math.abs(diff) > 0.000001) {
      changes.push({ owner, diff, direction: diff > 0 ? 'buy' : 'sell' });
    }
  }
  return {
    signature: tx.transaction?.signatures?.[0] || null,
    blockTime: tx.blockTime || null,
    changes,
  };
}

// Lấy N giao dịch gần nhất của 1 pool, đọc thô trực tiếp — không qua Dexscreener.
// LƯU Ý CHI PHÍ: mỗi giao dịch cần 1 lệnh gọi getTransaction riêng — tốn nhiều
// credit Helius hơn hẳn 1 lệnh gọi Dexscreener. Chỉ dùng khi thực sự cần dữ liệu
// "chưa qua xử lý", ví dụ đối chiếu/kiểm tra chéo, không nên dùng thay thế hoàn
// toàn cho luồng chính (Dexscreener/GeckoTerminal) vì chi phí cao hơn nhiều.
async function getRawRecentSwaps(poolAddress, targetMint, limit = 20) {
  const signatures = await heliusRpc('getSignaturesForAddress', [poolAddress, { limit }]);
  if (!signatures || signatures.length === 0) return [];

  const swaps = [];
  for (const sig of signatures) {
    try {
      const tx = await heliusRpc('getTransaction', [
        sig.signature,
        { maxSupportedTransactionVersion: 0 },
      ]);
      if (!tx) continue;
      const parsed = parseSwapFromTransaction(tx, targetMint);
      if (parsed.changes.length > 0) swaps.push(parsed);
    } catch (e) {
      // 1 giao dịch lỗi không được làm hỏng cả danh sách -> bỏ qua, tiếp tục
      continue;
    }
  }
  return swaps;
}

module.exports = { parseSwapFromTransaction, getRawRecentSwaps };
