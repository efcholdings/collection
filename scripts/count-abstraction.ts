
import { prisma } from '@/lib/prisma';

async function main() {
    const count = await prisma.artwork.count({
        where: {
            category: { contains: 'Abstraction' }
        }
    });
    console.log(`Artworks with 'Abstraction' in category: ${count}`);

    const strictCount = await prisma.artwork.count({
        where: {
            category: 'Abstraction'
        }
    });
    console.log(`Artworks with strict category 'Abstraction': ${strictCount}`);

}

main();
