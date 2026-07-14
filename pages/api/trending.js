import { fetchTrendingCandidates, fetchNewCandidates, rankByMode } from '../../lib/trending';
import { enrichWithCredibility } from '../../lib/credibility';
import { checkRateLimit, getClientIp } from '../../lib/security';
import { getChain } from '../../lib/chains';
import { cached } from '../../lib/cache';

export default async function handler(req, res) {
  const { chain, mode, sortBy, count } = req.query;

  const ip = getClientIp(req);
  if (!checkRateLimit(ip).allowed) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút' });
  }

  const chainInfo = getChain(chain || 'solana');
  if (!chainInfo) {
    return res.status(400).json({ error: 'Chain không được hỗ trợ' });
  }

  const rankMode = ['trending', 'new', 'top'].includes(mode) ? mode : 'trending';
  const rankSortBy = sortBy === 'txns' ? 'txns' : 'volume';
  const desiredCount = count === '200' ? 200 : 100; // đúng yêu cầu: 100 hoặc kéo thêm tới 200

  try {
    const cacheKey = `trending:${chainInfo.geckoTerminalId}:${rankMode}:${rankSortBy}:${desiredCount}`;
    // Cache 2 phút — không cần tươi tới từng giây, tránh gọi GeckoTerminal liên tục
    const ranked = await cached(cacheKey, 120, async () => {
      const candidates =
        rankMode === 'new'
          ? await fetchNewCandidates(chainInfo.geckoTerminalId, desiredCount)
          : await fetchTrendingCandidates(chainInfo.geckoTerminalId, desiredCount);

      const base = rankByMode(candidates, rankMode, { sortBy: rankSortBy });

      // Làm giàu top 30 với hồ sơ xã hội + ảnh (chỉ top 30, tiết kiệm chi phí như đã thiết kế)
      return enrichWithCredibility(base, chainInfo.dexscreenerId, 30);
    });
    return res.status(200).json({ tokens: ranked, mode: rankMode });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
