
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

const targets = [
    // User reported broken paths (as seen in browser/source)
    "/images/ASIS, A_NOTEBOOK 320_100 5X6.JPG",
    "/images/AROCHA, C_PERSIANA_VT 300 20X211.jpg",
    "/images/_MG_2528.jpg"
];

async function check() {
    console.log("--- Checking Database Records (by exact match or partial) ---");

    for (const target of targets) {
        // Try to find by exact path first
        let records = await prisma.artwork.findMany({
            where: { imagePath: target }
        });

        if (records.length > 0) {
            console.log(`[DB MATCH] Found record for '${target}' -> ID: ${records[0].id}, Path: ${records[0].imagePath}`);
        } else {
            console.log(`[DB MISS] No record found for exact path '${target}'`);

            // Try fuzzy search for the filename part
            const basename = path.basename(target);
            // Try matching just the filename part in the DB path
            const fuzzy = await prisma.artwork.findMany({
                where: { imagePath: { contains: basename } }
            });
            if (fuzzy.length > 0) {
                console.log(`   -> Found ${fuzzy.length} fuzzy matches for '${basename}':`);
                fuzzy.forEach(f => console.log(`      ID: ${f.id}, Path: ${f.imagePath}`));
            }
        }
    }

    console.log("\n--- Checking File System ---");
    // Check if the original or sanitized versions exist
    const filenames = targets.map(t => path.basename(t));

    for (const name of filenames) {
        const originalPath = path.join(IMAGES_DIR, name);
        const sanitizedName = name.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/_+/g, '_');
        const sanitizedPath = path.join(IMAGES_DIR, sanitizedName);

        if (fs.existsSync(originalPath)) {
            console.log(`[FILE EXISTS] Original: ${name}`);
        } else {
            console.log(`[FILE MISSING] Original: ${name}`);
        }

        if (originalPath !== sanitizedPath) {
            if (fs.existsSync(sanitizedPath)) {
                console.log(`[FILE EXISTS] Sanitized: ${sanitizedName}`);
            } else {
                console.log(`[FILE MISSING] Sanitized: ${sanitizedName}`);
            }
        }
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
