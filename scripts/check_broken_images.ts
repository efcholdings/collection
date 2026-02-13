
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for broken artwork images...');

    const brokenArtworks = await prisma.artwork.findMany({
        where: {
            OR: [
                { imagePath: null },
                { imagePath: '' }
            ]
        },
        select: {
            id: true,
            title: true,
            originalId: true,
            imagePath: true
        }
    });

    if (brokenArtworks.length === 0) {
        console.log('No broken artworks found.');
    } else {
        console.log(`Found ${brokenArtworks.length} artworks with missing images:`);
        brokenArtworks.forEach(a => {
            console.log(`- [${a.id}] ${a.title} (OriginalID: ${a.originalId || 'N/A'})`);
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
