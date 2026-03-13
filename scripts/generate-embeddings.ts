// Generate Semantic Embeddings for the entire Artwork library
import { PrismaClient } from '@prisma/client';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embedMany } from 'ai';

const prisma = new PrismaClient();

// Clean API key similar to how we do in search.ts to avoid Vercel BOM errors (just in case this runs on server)
const cleanApiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
const google = createGoogleGenerativeAI({
  apiKey: cleanApiKey,
});

async function main() {
    console.log("Starting Semantic Vectorization Engine...");

    // 1. Fetch all artworks
    const artworks = await prisma.artwork.findMany({
        select: {
            id: true,
            title: true,
            artist: true,
            category: true,
            medium: true,
            year: true,
            notes: true,
            description: true,
        }
    });

    console.log(`Found ${artworks.length} artworks. Compiling Semantic Strings...`);

    // 2. Compile strings for the embedding model
    const stringsToEmbed: string[] = artworks.map((art) => {
        const parts = [];
        if (art.title) parts.push(`Title: ${art.title}`);
        if (art.artist) parts.push(`Artist: ${art.artist}`);
        if (art.category) parts.push(`Category: ${art.category}`);
        if (art.medium) parts.push(`Medium: ${art.medium}`);
        if (art.year) parts.push(`Year: ${art.year}`);
        if (art.notes) parts.push(`Internal Notes: ${art.notes}`);
        if (art.description) parts.push(`Description: ${art.description}`);
        
        return parts.join(" | ");
    });

    console.log("Sample Semantic String:", stringsToEmbed[0]);
    console.log("Generating 768-D Vectors via Google Gemini (text-embedding-004)...");

    // 3. Batch generate embeddings using Gemini in chunks of 100 (Google maximum)
    const CHUNK_SIZE = 100;
    let updatedCount = 0;

    for (let i = 0; i < stringsToEmbed.length; i += CHUNK_SIZE) {
        const chunkStrings = stringsToEmbed.slice(i, i + CHUNK_SIZE);
        const chunkArtworks = artworks.slice(i, i + CHUNK_SIZE);

        try {
            // Execute batchEmbedContents mapping 100 strings simultaneously
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${cleanApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: chunkStrings.map(text => ({
                        model: "models/gemini-embedding-001",
                        content: { parts: [{ text }] }
                    }))
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Google API Error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            const embeddings = data.embeddings.map((e: any) => e.values);

            // 4. Update the database using pgvector string format "[0.1, 0.2, ...]"
            for (let j = 0; j < embeddings.length; j++) {
                const artId = chunkArtworks[j].id;
                const vector = embeddings[j];
                
                // Format for pgvector insertion
                const vectorStr = `[${vector.join(',')}]`;

                // Execute raw SQL to bypass Prisma's lack of native Unsupported mapping
                await prisma.$executeRawUnsafe(
                    `UPDATE "Artwork" SET embedding = $1::vector WHERE id = $2`,
                    vectorStr,
                    artId
                );
                
                updatedCount++;
            }
            
            console.log(`Saved ${updatedCount}/${stringsToEmbed.length} vectors to Supabase...`);
            
            // tiny delay to prevent rate limiting
            await new Promise(res => setTimeout(res, 500));

        } catch (e) {
            console.error(`Fatal exception during chunk ${i}-${i + CHUNK_SIZE}:`, e);
            // Optionally continue or break
            break;
        }
    }

    console.log(`\n✅ Vectorization Complete! ${updatedCount} Artworks successfully mapped to Cartesian space.`);
    await prisma.$disconnect();
}

main().catch(console.error);
