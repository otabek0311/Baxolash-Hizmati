import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superadminPassword = process.env.SUPERADMIN_PASSWORD;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!superadminPassword || !adminPassword) {
    throw new Error('SUPERADMIN_PASSWORD va ADMIN_PASSWORD .env da belgilanishi kerak');
  }

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@qrhujjat.uz' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@qrhujjat.uz',
      password: await bcrypt.hash(superadminPassword, 12),
      role: Role.SUPERADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@qrhujjat.uz' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@qrhujjat.uz',
      password: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
      createdById: superadmin.id,
    },
  });

  await prisma.systemSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      defaultRetentionDays: 30,
      minRetentionDays: 7,
      maxRetentionDays: 90,
      maxFileSizeMb: 150,
    },
  });

  console.log('Seed muvaffaqiyatli yakunlandi');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
