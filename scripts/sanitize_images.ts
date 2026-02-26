
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

function sanitizeFilename(filename: string): string {
    // Replace non-alphanumeric/dot/dash/underscore with underscore
    let newName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    // Collapse multiple underscores
    newName = newName.replace(/_+/g, '_');
    return newName;
}

async function main() {
    console.log(`Scanning ${IMAGES_DIR}...`);
    const files = fs.readdirSync(IMAGES_DIR);
    let count = 0;

    for (const file of files) {
        const originalPath = path.join(IMAGES_DIR, file);

        // Skip directories
        if (fs.statSync(originalPath).isDirectory()) continue;

        const sanitized = sanitizeFilename(file);

        if (file !== sanitized) {
            const newPath = path.join(IMAGES_DIR, sanitized);
            const dbOldPath = `/images/${file}`;
            const dbNewPath = `/images/${sanitized}`;

            // Check collision
            if (fs.existsSync(newPath)) {
                console.warn(`Target exists: ${sanitized}. Updating DB and removing source.`);

                // Update DB to point to existing sanitized file
                const result = await prisma.artwork.updateMany({
                    where: { imagePath: dbOldPath },
                    data: { imagePath: dbNewPath }
                });
                console.log(`Updated DB records: ${result.count}`);

                // Delete source file (since target exists)
                try {
                    fs.unlinkSync(originalPath);
                    console.log(`Deleted source: ${file}`);
                } catch (err) {
                    console.error(`Failed to delete source ${file}:`, err);
                }
                continue;
            }

            // Standard Rename
            try {
                // Find and update
                const result = await prisma.artwork.updateMany({
                    where: { imagePath: dbOldPath },
                    data: { imagePath: dbNewPath }
                });

                if (result.count > 0) {
                    console.log(`Updated DB: ${dbOldPath} -> ${dbNewPath}`);
                }

                // Rename file
                fs.renameSync(originalPath, newPath);
                console.log(`Renamed: ${file} -> ${sanitized}`);
                count++;
            } catch (error) {
                console.error(`Error processing ${file}:`, error);
            }
        }
    }

    console.log(`\nSanitization complete. Renamed ${count} files.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
