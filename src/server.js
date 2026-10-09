import 'dotenv/config';
import { app } from './app.js';
import { prisma } from './db.js';

for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`API listening on port ${port}`));
async function shutdown() { server.close(async () => { await prisma.$disconnect(); process.exit(0); }); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
