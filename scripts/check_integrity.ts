
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
// Ensure we look in the right place: project root / public
const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function check() {
    console.log("Scanning DB for missing files...");
    const artworks = await prisma.artwork.findMany({
        where: {
            imagePath: { not: null }
        },
        select: { id: true, imagePath: true, title: true }
    });

    let missingCount = 0;
    const missingIds: string[] = [];

    for (const art of artworks) {
        if (!art.imagePath) continue;

        // Remove leading slash for path.join
        const relativePath = art.imagePath.startsWith('/') ? art.imagePath.slice(1) : art.imagePath;
        const fullPath = path.join(PUBLIC_DIR, relativePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`[MISSING] ID: ${art.id} | Path: ${art.imagePath}`);
            missingIds.push(art.id);
            missingCount++;
        }
    }

    console.log(`\nTotal Artworks with Images: ${artworks.length}`);
    console.log(`Total Missing Files: ${missingCount}`);

    if (missingIds.length > 0) {
        console.log(`\nUnlinking ${missingIds.length} missing images from DB...`);
        const result = await prisma.artwork.updateMany({
            where: { id: { in: missingIds } },
            data: { imagePath: null }
        });
        console.log(`Updated ${result.count} records. Image paths set to null.`);
    } else {
        console.log("No missing files found. Database is consistent.");
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
