import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const schema = z.object({ items: z.array(z.object({ pid: z.coerce.number().int().positive(), qty: z.coerce.number().int().positive() })).min(1) });
router.use(requireAuth);

router.post('/', async (req, res) => {
  const { items } = schema.parse(req.body);
  const combined = [...items.reduce((map, item) => map.set(item.pid, (map.get(item.pid) || 0) + item.qty), new Map())].map(([pid, qty]) => ({ pid, qty }));
  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { pid: { in: combined.map((i) => i.pid) } } });
    if (products.length !== combined.length) throw Object.assign(new Error('One or more products do not exist'), { status: 400 });
    for (const item of combined) {
      const updated = await tx.product.updateMany({ where: { pid: item.pid, quantity: { gte: item.qty } }, data: { quantity: { decrement: item.qty } } });
      if (updated.count !== 1) throw Object.assign(new Error(`Insufficient stock for product ${item.pid}`), { status: 409 });
    }
    return tx.order.create({ data: { uid: req.user.uid, details: { create: combined.map((item) => ({ pid: item.pid, qty: item.qty, unit_price: products.find((p) => p.pid === item.pid).price })) }, shipments: { create: { status: 'PENDING' } } }, include: { details: { include: { product: true } }, shipments: true } });
  });
  res.status(201).json(order);
});

router.get('/', async (req, res) => res.json(await prisma.order.findMany({ where: { uid: req.user.uid }, include: { details: true, shipments: true }, orderBy: { createat: 'desc' } })));
router.get('/:oid', async (req, res) => {
  const order = await prisma.order.findFirst({ where: { oid: Number(req.params.oid), uid: req.user.uid }, include: { details: { include: { product: true } }, shipments: true } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});
export default router;
