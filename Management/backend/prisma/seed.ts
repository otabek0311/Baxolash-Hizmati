import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  const existingAdmin = await prisma.generalAdmin.findUnique({
    where: { email: 'general@qrhujjat.uz' },
  });

  if (existingAdmin) {
    console.log('General admin allaqachon mavjud, o\'tkazib yuborildi.');
    return;
  }

  const hashedPassword = await bcrypt.hash('general123', 10);

  const admin = await prisma.generalAdmin.create({
    data: {
      email: 'general@qrhujjat.uz',
      password: hashedPassword,
      name: 'General Admin',
    },
  });

  console.log(`General admin yaratildi: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error('Seed xatoligi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
