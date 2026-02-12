
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const artwork = await prisma.artwork.findFirst({
        where: {
            title: {
                contains: 'Classic Landscape with Ruins'
            }
        }
    });
    console.log('Found Artwork:', JSON.stringify(artwork, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
