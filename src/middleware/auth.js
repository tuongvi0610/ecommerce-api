import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export async function requireAuth(req, res, next) {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Bearer token is required' });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { uid: payload.sub }, select: { uid: true, username: true, roleid: true } });
    if (!user) return res.status(401).json({ error: 'Invalid token user' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
