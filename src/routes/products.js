import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const router = Router();
const schema = z.object({ pname: z.string().min(1).max(100), price: z.coerce.number().positive().max(99999999.99), quantity: z.coerce.number().int().nonnegative() });
router.get('/', async (_req, res) => res.json(await prisma.product.findMany({ orderBy: { pid: 'asc' } })));
router.get('/:pid', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { pid: Number(req.params.pid) } });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});
router.post('/', async (req, res) => {
  const data = schema.parse(req.body);
  res.status(201).json(await prisma.product.create({ data }));
});
export default router;
