
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaths() {
    const artworks = await prisma.artwork.findMany({ take: 5 });
    console.log(artworks.map(a => a.imagePath));
}

checkPaths()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
