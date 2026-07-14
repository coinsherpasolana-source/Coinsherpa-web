import { fetchTrendingCandidates, rankTrending } from '../../lib/trending';
import { enrichWithCredibility } from '../../lib/credibility';
import { checkRateLimit, getClientIp } from '../../lib/security';
import { getChain } from '../../lib/chains';
import { cached } from '../../lib/cache';

export default async function handler(req, res) {
  const { chain } = req.query;

  const ip = getClientIp(req);
  if (!checkRateLimit(ip).allowed) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút' });
  }

  const chainInfo = getChain(chain || 'solana');
  if (!chainInfo) {
    return res.status(400).json({ error: 'Chain không được hỗ trợ' });
  }

  try {
    // Cache 2 phút — trending không cần tươi tới từng giây, tránh gọi GeckoTerminal liên tục
    const ranked = await cached(`trending:${chainInfo.geckoTerminalId}`, 120, async () => {
      const candidates = await fetchTrendingCandidates(chainInfo.geckoTerminalId, 100);
      const base = rankTrending(candidates);
      // Làm giàu top 30 với hồ sơ xã hội (website/TG/X/Discord) — kết hợp "ổn định" (GeckoTerminal)
      // với "đầy đủ cộng đồng thật" (Dexscreener info), xếp hạng lại theo finalScore
      return enrichWithCredibility(base, chainInfo.dexscreenerId, 30);
    });
    return res.status(200).json({ tokens: ranked });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
