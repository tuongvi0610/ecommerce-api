import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', async (req, res) => res.json(await prisma.shipment.findMany({ where: { order: { uid: req.user.uid } }, include: { order: { select: { oid: true, createat: true } } }, orderBy: { shipid: 'asc' } })));
router.get('/:shipid', async (req, res) => {
  const shipment = await prisma.shipment.findFirst({ where: { shipid: Number(req.params.shipid), order: { uid: req.user.uid } }, include: { order: { select: { oid: true, createat: true } } } });
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  res.json(shipment);
});
export default router;
