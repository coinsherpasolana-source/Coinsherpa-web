import { fetchSolanaMemeCoinsByMarketCap, resolveSolanaMint } from '../../lib/blueChip';
import { checkRateLimit, getClientIp } from '../../lib/security';

export default async function handler(req, res) {
  const { resolveMint } = req.query;

  const ip = getClientIp(req);
  if (!checkRateLimit(ip).allowed) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút' });
  }

  try {
    // Chế độ tra địa chỉ mint riêng — chỉ gọi khi user bấm vào 1 token cụ thể
    if (resolveMint) {
      const mint = await resolveSolanaMint(resolveMint);
      return res.status(200).json({ mint });
    }

    const result = await fetchSolanaMemeCoinsByMarketCap(200);
    if (result.error) {
      return res.status(200).json({ tokens: [], error: result.error });
    }
    return res.status(200).json({ tokens: result.tokens });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
