import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  await prisma.role.upsert({ where: { rolename: 'normal' }, update: {}, create: { rolename: 'normal' } });
  await prisma.role.upsert({ where: { rolename: 'admin' }, update: {}, create: { rolename: 'admin' } });
  await prisma.membership.upsert({ where: { mname: 'standard' }, update: {}, create: { mname: 'standard', score: 10 } });
  for (const product of [
    { pname: 'Product X', price: '100.00', quantity: 100 },
    { pname: 'Product Y', price: '50.00', quantity: 100 }
  ]) {
    const existing = await prisma.product.findFirst({ where: { pname: product.pname } });
    if (existing) await prisma.product.update({ where: { pid: existing.pid }, data: product });
    else await prisma.product.create({ data: product });
  }
  console.log('Seeded roles, standard membership and products X/Y.');
} finally {
  await prisma.$disconnect();
}
