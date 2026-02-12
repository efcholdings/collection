import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const PILOT_CSV_PATH = path.join(__dirname, '../../Artworks_Pilot.csv');
const MAPPING_CSV_PATH = path.join(__dirname, '../../image_mapping.csv');
const IMAGES_DIR = path.join(__dirname, '../../artwork_images');
const PUBLIC_DIR = path.join(__dirname, '../public');
const PUBLIC_IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

async function main() {
    console.log('Starting seed process...');

    // Ensure public/images exists
    if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
        fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
    }

    // Parse Image Mapping
    // ID, Filename
    const mappingContent = fs.readFileSync(MAPPING_CSV_PATH, 'utf-8');
    // Handle BOM if present
    const cleanMappingContent = mappingContent.replace(/^\uFEFF/, '');
    const mappingRecords = parse(cleanMappingContent, {
        columns: false, // No headers in file
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

    // Parse Artworks Pilot
    // No headers. Based on inspection:
    // 0: ID
    // 1: Title
    // 2: Artist
    // 3: Year
    // 4: Medium
    // ...
    // Last: Category (Contemporary)
    const pilotContent = fs.readFileSync(PILOT_CSV_PATH, 'utf-8');
    const cleanPilotContent = pilotContent.replace(/^\uFEFF/, '');
    const pilotRecords = parse(cleanPilotContent, {
        columns: false,
        skip_empty_lines: true,
        relax_quotes: true, // Handle potential messy quotes
    });

    console.log(`Loaded ${pilotRecords.length} artwork records.`);

    for (const record of pilotRecords) {
        const originalId = record[0]?.trim();
        if (!originalId) continue;

        const title = record[1]?.trim() || 'Untitled';
        const artist = record[2]?.trim() || 'Unknown Artist';
        const year = record[3]?.trim();
        // Index 4 is medium description
        const medium = record[4]?.trim();

        // Dimensions
        const height = record[5]?.trim();
        const width = record[6]?.trim();
        // Index 7 is sometimes Depth, sometimes Notes/Price info
        // We will treat 7 as Depth and 8 as Notes based on the pattern
        const depth = record[7]?.trim();
        const notes = record[8]?.trim();

        // Usually the last column is Category "Contemporary"
        // Use the last element as category
        const category = record[record.length - 1]?.trim();

        let imagePath: string | null = null;
        if (imageMap.has(originalId)) {
            const originalFilename = imageMap.get(originalId);
            if (originalFilename) {
                // Physical file has leading underscore: _filename
                const physicalFilename = `_${originalFilename}`;
                const sourcePath = path.join(IMAGES_DIR, physicalFilename);

                if (fs.existsSync(sourcePath)) {
                    const destPath = path.join(PUBLIC_IMAGES_DIR, originalFilename);
                    fs.copyFileSync(sourcePath, destPath);
                    imagePath = `/images/${originalFilename}`;
                    console.log(`Copied image for ID ${originalId}: ${originalFilename}`);
                } else {
                    // Try without underscore just in case mapping differs
                    const altSourcePath = path.join(IMAGES_DIR, originalFilename);
                    if (fs.existsSync(altSourcePath)) {
                        const destPath = path.join(PUBLIC_IMAGES_DIR, originalFilename);
                        fs.copyFileSync(altSourcePath, destPath);
                        imagePath = `/images/${originalFilename}`;
                        console.log(`Copied image (no underscore) for ID ${originalId}: ${originalFilename}`);
                    } else {
                        console.warn(`Image missing for ID ${originalId}: ${physicalFilename}`);
                    }
                }
            }
        }

        try {
            // @ts-ignore - Prisma client update might be locked
            await prisma.artwork.upsert({
                where: { originalId },
                update: {
                    title,
                    artist,
                    year,
                    medium,
                    height,
                    width,
                    depth,
                    notes,
                    category,
                    imagePath,
                },
                create: {
                    originalId,
                    title,
                    artist,
                    year,
                    medium,
                    height,
                    width,
                    depth,
                    notes,
                    category,
                    imagePath,
                },
            });
        } catch (e) {
            console.error(`Failed to insert artwork ID ${originalId}:`, e);
        }
    }

    console.log('Seed process completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
