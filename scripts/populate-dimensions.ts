import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Converts a dimension string into Centimeters
function parseDimensionToCm(value: string | null): number | null {
    if (!value) return null;
    
    const str = value.toLowerCase().trim();
    // Match the first number sequence (including decimals)
    const match = str.match(/[\d.]+/);
    if (!match) return null;
    
    const num = parseFloat(match[0]);
    if (isNaN(num)) return null;

    // Detect Unit
    if (str.includes('in') || str.includes('"') || str.includes('inches')) {
        return num * 2.54;
    }
    if (str.includes('ft') || str.includes("'") || str.includes('feet')) {
        return num * 30.48;
    }
    if (str.includes('mm') || str.includes('millimeters')) {
        return num / 10;
    }
    if (str.includes('m ') || str.endsWith('m') || str.includes('meters')) {
        // Exclude 'cm' and 'mm' matches
        if (!str.includes('cm') && !str.includes('mm') && !str.includes('medium')) {
            return num * 100;
        }
    }
    // Default or explicitly 'cm'
    return num;
}

async function main() {
    console.log("Starting dimension metric conversion...");
    
    const artworks = await prisma.artwork.findMany({
        where: {
            OR: [
                { widthCm: null },
                { heightCm: null }
            ]
        }
    });

    console.log(`Found ${artworks.length} artworks needing dimension standardized.`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const art of artworks) {
        const widthCm = parseDimensionToCm(art.width);
        const heightCm = parseDimensionToCm(art.height);
        const depthCm = parseDimensionToCm(art.depth);

        if (widthCm !== null || heightCm !== null || depthCm !== null) {
            await prisma.artwork.update({
                where: { id: art.id },
                data: { widthCm, heightCm, depthCm }
            });
            updatedCount++;
            console.log(`✅ Updated [${art.title}]: W:${widthCm} H:${heightCm} D:${depthCm}`);
        } else {
            console.log(`⚠️ Skipped [${art.title}] - Invalid or Missing strings (W:${art.width} H:${art.height})`);
            failedCount++;
        }
    }

    console.log(`\nFinished. Successfully updated ${updatedCount} records. Skipped ${failedCount}.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
