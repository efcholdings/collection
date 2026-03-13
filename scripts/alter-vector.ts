import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    try {
        console.log("Forcing alter on embedding column to vector(3072)...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "Artwork" ALTER COLUMN embedding TYPE vector(3072);`);
        console.log("Success! Column geometry altered.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
