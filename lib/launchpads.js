// Đăng ký các launchpad/DEX nhận biết được qua trường `dexId` của Dexscreener.
// Thêm launchpad mới sau này chỉ cần thêm 1 dòng vào đây.
const LAUNCHPADS = {
  pumpfun: { id: 'pumpfun', label: 'Pump.fun', description: 'Launchpad memecoin phổ biến nhất trên Solana — ai cũng tạo token được chỉ trong vài giây.' },
  moonshot: { id: 'moonshot', label: 'Moonshot', description: 'Launchpad memecoin trên Solana, tích hợp sẵn trong ứng dụng DEX Screener.' },
  raydium: { id: 'raydium', label: 'Raydium', description: 'Sàn giao dịch phi tập trung (DEX) lớn trên Solana, nơi token thường lên sàn sau khi rời launchpad.' },
  meteora: { id: 'meteora', label: 'Meteora', description: 'DEX trên Solana chuyên về pool thanh khoản động (DLMM).' },
  orca: { id: 'orca', label: 'Orca', description: 'DEX lâu đời trên Solana.' },
  fourmeme: { id: 'fourmeme', label: 'four.meme', description: 'Launchpad memecoin phổ biến trên BNB Chain.' },
  bonkfun: { id: 'bonkfun', label: 'bonk.fun', description: 'Launchpad memecoin gắn với hệ sinh thái BONK trên Solana.' },
};

function getLaunchpad(dexId) {
  if (!dexId) return null;
  const key = dexId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return LAUNCHPADS[key] || null;
}

module.exports = { LAUNCHPADS, getLaunchpad };
