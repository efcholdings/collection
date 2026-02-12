import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Enable Write-Ahead Logging (WAL) mode
    const result = await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    console.log('Journal Mode set to:', result);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
