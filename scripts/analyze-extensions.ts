
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const artworks = await prisma.artwork.findMany({
        where: { imagePath: { not: null } },
        select: { imagePath: true }
    });

    const extensions = new Map<string, number>();

    artworks.forEach(a => {
        if (!a.imagePath) return;
        const parts = a.imagePath.split('.');
        if (parts.length > 1) {
            const ext = '.' + parts.pop()?.toLowerCase();
            extensions.set(ext, (extensions.get(ext) || 0) + 1);
        } else {
            extensions.set('no-extension', (extensions.get('no-extension') || 0) + 1);
        }
    });

    console.log('Image Extensions Distribution:');
    console.log(Object.fromEntries(extensions));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
