import express from 'express';
import helmet from 'helmet';
import { prisma } from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import shipmentRoutes from './routes/shipments.js';

export const app = express();
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.get('/health', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() }); }
  catch { res.status(503).json({ status: 'error', database: 'disconnected' }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  if (err?.name === 'ZodError') return res.status(400).json({ error: 'Invalid request', details: err.issues });
  if (err?.code === 'P2002') return res.status(409).json({ error: 'Value already exists' });
  if (err?.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});
