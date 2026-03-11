import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Initialize the Prisma Client to connect to Supabase (uses DATABASE_URL from .env)
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration to Supabase...');

  // 1. Connect to the local SQLite database
  const sqliteDbPath = path.resolve(process.cwd(), 'prisma', 'dev2.db');
  console.log(`Reading from local SQLite database at: ${sqliteDbPath}`);
  
  const db = new Database(sqliteDbPath, { readonly: true });
  
  // 2. Read all existing artworks from SQLite
  const artworks = db.prepare('SELECT * FROM Artwork').all() as any[];
  console.log(`Found ${artworks.length} artworks in the local database.`);

  if (artworks.length === 0) {
    console.log('No artworks to migrate. Exiting.');
    return;
  }

  // 3. Insert each artwork into the Supabase database
  let successCount = 0;
  let errorCount = 0;

  for (const artwork of artworks) {
    try {
      // Create new artwork in Postgres using Prisma
      // (Mapping the raw SQLite data to Prisma format)
      await prisma.artwork.upsert({
        where: { originalId: artwork.originalId },
        update: {
            // If it exists, we update it to sync
            title: artwork.title,
            artist: artwork.artist,
            year: artwork.year,
            medium: artwork.medium,
            category: artwork.category,
            height: artwork.height,
            width: artwork.width,
            depth: artwork.depth,
            notes: artwork.notes,
            appraisalValue: artwork.appraisalValue,
            purchasePrice: artwork.purchasePrice,
            imagePath: artwork.imagePath,
            imagePath2: artwork.imagePath2,
            imagePath3: artwork.imagePath3,
            imagePath4: artwork.imagePath4,
            imagePath5: artwork.imagePath5,
            description: artwork.description,
            // Convert SQLite numeric dates to Date objects if needed, 
            // though Prisma usually handles standard date inputs
            createdAt: new Date(artwork.createdAt),
            updatedAt: new Date(artwork.updatedAt),
        },
        create: {
            id: artwork.id, // Preserve existing ID
            originalId: artwork.originalId,
            title: artwork.title,
            artist: artwork.artist,
            year: artwork.year,
            medium: artwork.medium,
            category: artwork.category,
            height: artwork.height,
            width: artwork.width,
            depth: artwork.depth,
            notes: artwork.notes,
            appraisalValue: artwork.appraisalValue,
            purchasePrice: artwork.purchasePrice,
            imagePath: artwork.imagePath,
            imagePath2: artwork.imagePath2,
            imagePath3: artwork.imagePath3,
            imagePath4: artwork.imagePath4,
            imagePath5: artwork.imagePath5,
            description: artwork.description,
            createdAt: new Date(artwork.createdAt),
            updatedAt: new Date(artwork.updatedAt),
        }
      });
      console.log(`✅ Migrated: ${artwork.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to migrate: ${artwork.title}`, error);
      errorCount++;
    }
  }

  console.log('--- Migration Summary ---');
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  
  // Close database connections
  db.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
