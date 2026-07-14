// API route này chạy TRÊN SERVER của Vercel, không bao giờ chạy trên trình duyệt.
// Trình duyệt chỉ gọi tới /api/token-profile?mint=...&chain=solana
// và không bao giờ nhìn thấy HELIUS_API_KEY thật.

import { buildTokenProfile } from '../../lib/tokenProfile';
import { isValidSolanaAddress, checkRateLimit, getClientIp } from '../../lib/security';
import { checkAccess } from '../../lib/accessControl';
import { getSession } from '../../lib/auth';

export default async function handler(req, res) {
  const { mint, chain } = req.query;

  // Lớp 1: chặn request quá tần suất TRƯỚC KHI kiểm tra gì khác (rẻ nhất, chặn sớm nhất)
  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút' });
  }

  // Lớp 2: chặn địa chỉ không đúng định dạng TRƯỚC KHI gọi Helius/RugCheck (tránh tốn tiền oan)
  if (!mint || !isValidSolanaAddress(mint)) {
    return res.status(400).json({ error: 'Địa chỉ token không hợp lệ' });
  }

  try {
    // Kiểm tra phiên đăng nhập (hiện luôn trả null vì Supabase chưa cấu hình thật —
    // nghĩa là devWallet sẽ luôn bị khóa cho tới khi nối Supabase thật, đúng chính
    // sách đã thống nhất, không cần sửa gì thêm khi Supabase sẵn sàng).
    const session = await getSession();
    const devWalletAccess = checkAccess(session, 'devWallet');

    const profile = await buildTokenProfile(mint, chain || 'solana', {
      includeDevWallet: devWalletAccess.allowed,
    });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
