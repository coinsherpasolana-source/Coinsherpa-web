import { getSession } from '../../lib/auth';
import { checkAccess } from '../../lib/accessControl';
import { getFolders, createFolder } from '../../lib/watchlistStore';
import { checkRateLimit, getClientIp } from '../../lib/security';

export default async function handler(req, res) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip).allowed) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút' });
  }

  const session = await getSession();
  const access = checkAccess(session, 'watchlist');
  if (!access.allowed) {
    return res.status(401).json({ error: access.reason });
  }

  if (req.method === 'GET') {
    const result = await getFolders(session.user.id);
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const { name } = req.body || {};
    const result = await createFolder(session.user.id, name);
    return res.status(result.success ? 200 : 400).json(result);
  }

  return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
}
