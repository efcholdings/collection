
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting image restoration process...');

    const projectRoot = process.cwd();
    let mappingPath = path.join(projectRoot, 'image_mapping.csv');

    // 1. Locate Image Mapping
    if (!fs.existsSync(mappingPath)) {
        const altPath = path.join(projectRoot, '../image_mapping.csv');
        if (fs.existsSync(altPath)) {
            console.log('Found mapping file at parent:', altPath);
            mappingPath = altPath;
        } else {
            console.error('Image mapping file not found at:', mappingPath, 'or', altPath);
            process.exit(1);
        }
    } else {
        console.log('Found mapping file at root:', mappingPath);
    }

    const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
    const cleanMappingContent = mappingContent.replace(/^\uFEFF/, '');
    const mappingRecords = parse(cleanMappingContent, {
        columns: false,
        skip_empty_lines: true,
    });

    const imageMap = new Map<string, string>();
    for (const record of mappingRecords) {
        const id = record[0]?.trim();
        const filename = record[1]?.trim();
        if (id && filename) {
            imageMap.set(id, filename);
        }
    }
    console.log(`Loaded ${imageMap.size} image mappings.`);

    // 2. Find Broken Artworks
    const brokenArtworks = await prisma.artwork.findMany({
        where: {
            OR: [
                { imagePath: null },
                { imagePath: '' }
            ]
        },
        select: { id: true, originalId: true, title: true }
    });

    console.log(`Found ${brokenArtworks.length} artworks with missing images.`);

    // 3. Restore Images
    let restoredCount = 0;
    let skippedCount = 0;

    for (const artwork of brokenArtworks) {
        if (!artwork.originalId) {
            console.log(`Skipping [${artwork.title}]: No OriginalID.`);
            skippedCount++;
            continue;
        }

        const filename = imageMap.get(artwork.originalId);
        if (filename) {
            const newPath = `/images/${filename}`;
            await prisma.artwork.update({
                where: { id: artwork.id },
                data: { imagePath: newPath }
            });
            console.log(`Restored [${artwork.title}] (${artwork.originalId}) -> ${newPath}`);
            restoredCount++;
        } else {
            console.log(`Skipping [${artwork.title}] (${artwork.originalId}): No mapping found.`);
            skippedCount++;
        }
    }

    console.log('--- Restoration Complete ---');
    console.log(`Restored: ${restoredCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
