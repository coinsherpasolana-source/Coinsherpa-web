// Đăng ký các chain được hỗ trợ. Thêm chain mới (ETH, Base, BNB...) sau này
// chỉ cần thêm 1 object vào đây — không cần sửa bất kỳ file nào khác.
const CHAINS = {
  solana: {
    id: 'solana',
    label: 'Solana',
    dexscreenerId: 'solana',
    geckoTerminalId: 'solana', // ký hiệu chain riêng của GeckoTerminal — có thể khác Dexscreener ở chain khác sau này
    description: 'Blockchain tốc độ cao, phí giao dịch cực rẻ — nơi phần lớn memecoin hiện nay được tạo ra.',
    active: true,
  },
};

function getActiveChains() {
  return Object.values(CHAINS).filter((c) => c.active);
}

function getChain(chainId) {
  return CHAINS[chainId] || null;
}

module.exports = { CHAINS, getActiveChains, getChain };
