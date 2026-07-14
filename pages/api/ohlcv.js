import { getOhlcv } from '../../lib/ohlcv';
import { isValidSolanaAddress, checkRateLimit, getClientIp } from '../../lib/security';
import { getChain } from '../../lib/chains';

export default async function handler(req, res) {
  const { pairAddress, chain, timeframe } = req.query;

  const ip = getClientIp(req);
  if (!checkRateLimit(ip).allowed) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút' });
  }

  if (!pairAddress || !isValidSolanaAddress(pairAddress)) {
    return res.status(400).json({ error: 'Địa chỉ pool không hợp lệ' });
  }

  const chainInfo = getChain(chain || 'solana');
  if (!chainInfo) {
    return res.status(400).json({ error: 'Chain không được hỗ trợ' });
  }

  try {
    const candles = await getOhlcv(chainInfo.geckoTerminalId, pairAddress, timeframe || '1h');
    return res.status(200).json({ candles });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
