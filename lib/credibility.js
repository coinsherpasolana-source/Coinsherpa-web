// Module "Độ tin cậy hồ sơ" — điểm THƯỞNG THÊM (không phải điểm chính) cho token
// có đầy đủ website/Telegram/X/Discord công khai. Đây là tín hiệu tương quan với
// "dự án nghiêm túc, có đội ngũ đứng tên" — KHÔNG PHẢI bảo đảm an toàn tuyệt đối,
// vì token lừa đảo vẫn có thể điền đủ link giả. Chỉ nên dùng như 1 tín hiệu cộng thêm,
// không thay thế cho kiểm tra bảo mật (mint/freeze authority, RugCheck...).

const { cached } = require('./cache');

function computeCredibilityBonus({ hasWebsite, hasTelegram, hasTwitter, hasDiscord }) {
  const count = [hasWebsite, hasTelegram, hasTwitter, hasDiscord].filter(Boolean).length;
  return count * 5; // tối đa +20 điểm
}

function extractSocialInfo(pairData) {
  const info = pairData?.info || {};
  const websites = info.websites || [];
  const socials = info.socials || [];
  return {
    hasWebsite: websites.length > 0,
    hasTelegram: socials.some((s) => s.type === 'telegram'),
    hasTwitter: socials.some((s) => s.type === 'twitter'),
    hasDiscord: socials.some((s) => s.type === 'discord'),
  };
}

async function fetchSocialInfo(chainDexId, pairAddress) {
  // Cache 10 phút — link xã hội gần như không đổi trong thời gian ngắn
  return cached(`social:${chainDexId}:${pairAddress}`, 600, async () => {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chainDexId}/${pairAddress}`);
    if (!res.ok) return { hasWebsite: false, hasTelegram: false, hasTwitter: false, hasDiscord: false };
    const json = await res.json();
    return extractSocialInfo(json.pair);
  });
}

// Làm giàu CHỈ top N ứng viên (không phải cả 100) để tiết kiệm số lệnh gọi API.
async function enrichWithCredibility(rankedTokens, chainDexId, topN = 30) {
  const toEnrich = rankedTokens.slice(0, topN);
  const rest = rankedTokens.slice(topN);

  const enriched = await Promise.all(
    toEnrich.map(async (token) => {
      const socialInfo = await fetchSocialInfo(chainDexId, token.poolAddress).catch(() => ({
        hasWebsite: false, hasTelegram: false, hasTwitter: false, hasDiscord: false,
      }));
      const credibilityBonus = computeCredibilityBonus(socialInfo);
      return {
        ...token,
        socialInfo,
        credibilityBonus,
        finalScore: Math.round((token.trendScore + credibilityBonus) * 10) / 10,
      };
    })
  );

  // Token ngoài top N giữ nguyên trendScore làm finalScore (không đủ ngân sách API để làm giàu hết)
  const untouched = rest.map((token) => ({ ...token, socialInfo: null, credibilityBonus: 0, finalScore: token.trendScore }));

  return [...enriched, ...untouched].sort((a, b) => b.finalScore - a.finalScore);
}

module.exports = { computeCredibilityBonus, extractSocialInfo, fetchSocialInfo, enrichWithCredibility };
