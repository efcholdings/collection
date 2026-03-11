import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt-ts';

const prisma = new PrismaClient();

async function main() {
  // Pass email and password as arguments
  // usage: npx ts-node scripts/create-user.ts admin@gallery.com SuperSecretPassword
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.error('Usage: npx ts-node scripts/create-user.ts <email> <password> [name] [role]');
    process.exit(1);
  }

  const name = process.argv[4] || 'Admin';
  const role = process.argv[5] || 'ADMIN';

  console.log(`Creating user: ${email}...`);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        hashedPassword,
        name,
        role
      },
      create: {
        email,
        hashedPassword,
        name,
        role
      }
    });

    console.log(`✅ User successfully created/updated: ${user.email} (ID: ${user.id})`);
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
