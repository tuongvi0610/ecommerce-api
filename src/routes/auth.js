import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';

const router = Router();
const registerSchema = z.object({ username: z.string().min(3).max(50), fullname: z.string().min(1).max(100), password: z.string().min(8).max(72) });
const loginSchema = z.object({ username: z.string().min(1).max(50), password: z.string().min(1).max(72) });

router.post('/register', async (req, res) => {
  const input = registerSchema.parse(req.body);
  const password = await bcrypt.hash(input.password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({ where: { rolename: 'normal' }, update: {}, create: { rolename: 'normal' } });
    const membership = await tx.membership.upsert({ where: { mname: 'standard' }, update: {}, create: { mname: 'standard', score: 10 } });
    return tx.user.create({ data: { ...input, password, roleid: role.roleid, mid: membership.mid }, select: { uid: true, username: true, fullname: true, role: { select: { rolename: true } }, membership: { select: { mname: true, score: true } } } });
  });
  res.status(201).json(user);
});

router.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { username: input.username } });
  if (!user || !(await bcrypt.compare(input.password, user.password))) return res.status(401).json({ error: 'Username or password is incorrect' });
  const token = jwt.sign({ sub: user.uid }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  res.json({ tokenType: 'Bearer', token, expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
});

export default router;
