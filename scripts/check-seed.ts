import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.artwork.count({
        where: {
            imagePath: { not: null },
        },
    });
    console.log(`Seeded Artworks with Images: ${count}`);

    const total = await prisma.artwork.count();
    console.log(`Total Artworks: ${total}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
