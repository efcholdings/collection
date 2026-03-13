'use server';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Artwork } from '@prisma/client';
import { auth } from '@/auth';

// Strip hidden BOM (\uFEFF) or zero-width spaces that often get copy-pasted into Vercel
const cleanApiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
const google = createGoogleGenerativeAI({
  apiKey: cleanApiKey,
});

// Define the schema for the AI to extract
const SearchFiltersSchema = z.object({
    keyword: z.string().optional().describe("Only extract key words here (e.g. 'Cuba', 'Red'). DO NOT put your reasoning here. DO NOT put measurements here."),
    category: z.string().optional().describe("Artwork category if mentioned (e.g., 'Painting', 'Sculpture', 'Photography')."),
    minYear: z.number().optional().describe("Minimum creation year if mentioned."),
    maxYear: z.number().optional().describe("Maximum creation year if mentioned."),
    minWidthCm: z.number().optional().describe("Exact minimum width in cm (1 inch = 2.54 cm)."),
    maxWidthCm: z.number().optional().describe("Exact maximum width in cm."),
    minHeightCm: z.number().optional().describe("Exact minimum height in cm."),
    maxHeightCm: z.number().optional().describe("Exact maximum height in cm."),
    minSizeCm: z.number().optional().describe("CRITICAL: If the user says 'larger than 20 inches' without specifying width/height, put the converted cm value (50.8) here exactly!"),
    maxSizeCm: z.number().optional().describe("CRITICAL: If the user says 'under 20 inches' without specifying width/height, put the converted cm value (50.8) here exactly!"),
    aiResponse: z.string().describe("ALWAYS write a quick, friendly, 1-sentence conversational confirmation of what you extracted from the user's prompt (e.g., 'Here are some large pieces created between 2000 and 2010.'). Make it sound helpful and intelligent.")
});

export async function searchArtworks(userQuery: string, page: number = 1): Promise<{ artworks: Artwork[], totalCount: number, debugError?: string, aiResponse?: string, totalTokensConsumed?: number }> {
    if (!userQuery.trim()) return { artworks: [], totalCount: 0 };

    const ITEMS_PER_PAGE = 50;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    try {
        const session = await auth();
        // @ts-ignore
        const userId = session?.user?.id;
        let totalTokensConsumed = 0;

        // 1. Interpret valid filters safely
        const { object: filters, usage } = await generateObject({
            model: google('gemini-2.0-flash'), // Available model confirmed via API
            schema: SearchFiltersSchema,
            prompt: `
            Extract search intent from: "${userQuery}".
            
            Rules:
            1. keyword: Extract key descriptive words (e.g. "Cuba", "Red"). NEVER include words like "larger", "smaller", "inches", "cm", "feet", "wide", "tall" here!
            2. Dimensions: Convert measurements to centimeters (1 inch = 2.54 cm). 
            3. CRITICAL: If a measurement does not specify width or height (e.g. "larger than 20 inches"), YOU MUST put the converted cm value in minSizeCm (if "larger") or maxSizeCm (if "under").
            4. aiResponse: You MUST generate a conversational response to the user summarizing what you understood. Examples: "Here are some red paintings from 1990." or "Looking for abstract works wider than 5 feet."
            
            Examples:
            - "abstraction artworks" -> { "category": "Abstraction", "aiResponse": "Here are some abstraction pieces from the collection." }
            - "red paintings from 1990" -> { "keyword": "red", "category": "Painting", "minYear": 1990, "aiResponse": "I found these red paintings created around 1990." }
            - "Cuba larger than 20 inches" -> { "keyword": "Cuba", "minSizeCm": 50.8, "aiResponse": "Searching for pieces related to Cuba that are larger than 20 inches (50.8cm)." }
            - "artworks under 100 cm tall" -> { "maxHeightCm": 100, "aiResponse": "Here are artworks strictly under 100 cm in height." }
            `,
        });

        if (usage && usage.totalTokens) {
            totalTokensConsumed += usage.totalTokens;
            if (userId) {
                // Background log to database without blocking
                prisma.tokenLedger.create({
                    data: { userId, action: 'KEYWORD_CLASSIFICATION', tokens: usage.totalTokens }
                }).catch(e => console.error("Token logging failed:", e));
            }
        }

        console.log('AI Interpreted Filters:', filters);

        // 2. Fetch Gemini Embedding for Semantic Vector Search if keyword exists
        let keywordEmbedding: number[] | null = null;
        if (filters.keyword) {
            console.log(`Extracting 3072-D Semantic Vectors for keyword: "${filters.keyword}"`);
            const emRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${cleanApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'models/gemini-embedding-001',
                    content: { parts: [{ text: filters.keyword }] }
                })
            });
            if (emRes.ok) {
                const emData = await emRes.json();
                keywordEmbedding = emData.embedding.values;
                
                // Vector Token tracking approximation (1 token ~= 4 chars)
                const approxTokens = Math.max(2, Math.ceil(filters.keyword.length / 4));
                totalTokensConsumed += approxTokens;
                if (userId) {
                    prisma.tokenLedger.create({
                        data: { userId, action: 'VECTOR_EMBEDDING', tokens: approxTokens }
                    }).catch(e => console.error("Token logging failed:", e));
                }
            } else {
                console.error("Vector Extraction failed:", await emRes.text());
            }
        }

        let artworks: any[] = [];
        let totalCount = 0;

        // 3. Database Query Execution (Hybrid vs Traditional)
        if (keywordEmbedding) {
            // HYBRID VECTOR SEARCH (Prisma Raw SQL for pgvector <=>)
            const vectorStr = `[${keywordEmbedding.join(',')}]`;
            
            // Build raw SQL conditions for dimensions/category
            const conditions: any[] = [];
            if (filters.category) conditions.push(`category ILIKE '%${filters.category.replace(/'/g, "''")}%'`);
            if (filters.minWidthCm) conditions.push(`"widthCm" >= ${filters.minWidthCm}`);
            if (filters.maxWidthCm) conditions.push(`"widthCm" <= ${filters.maxWidthCm}`);
            if (filters.minHeightCm) conditions.push(`"heightCm" >= ${filters.minHeightCm}`);
            if (filters.maxHeightCm) conditions.push(`"heightCm" <= ${filters.maxHeightCm}`);
            
            if (filters.minSizeCm) {
                conditions.push(`("widthCm" >= ${filters.minSizeCm} OR "heightCm" >= ${filters.minSizeCm})`);
            }
            if (filters.maxSizeCm) {
                conditions.push(`("widthCm" <= ${filters.maxSizeCm} OR "heightCm" <= ${filters.maxSizeCm})`);
            }

            const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            
            // Execute Vector Cosine Similarity Map
            console.log("Executing Vector SQL query on Supabase...");
            const rawVectorResults = await prisma.$queryRawUnsafe<any[]>(`
                SELECT id, title, artist, year, medium, category, width, height, "widthCm", "heightCm", "imagePath"
                FROM "Artwork"
                ${whereSql}
                ORDER BY embedding <=> $1::vector
                LIMIT 100;
            `, vectorStr);

            artworks = rawVectorResults;
            totalCount = rawVectorResults.length;
        } else {
            // TRADITIONAL DIMENSIONAL SEARCH (Native Prisma ORM)
            const where: any = {};

            if (filters.category) {
                where.category = { contains: filters.category, mode: 'insensitive' };
            }
            if (filters.minWidthCm || filters.maxWidthCm) {
                where.widthCm = {};
                if (filters.minWidthCm) where.widthCm.gte = filters.minWidthCm;
                if (filters.maxWidthCm) where.widthCm.lte = filters.maxWidthCm;
            }
            if (filters.minHeightCm || filters.maxHeightCm) {
                where.heightCm = {};
                if (filters.minHeightCm) where.heightCm.gte = filters.minHeightCm;
                if (filters.maxHeightCm) where.heightCm.lte = filters.maxHeightCm;
            }
            if (filters.minSizeCm || filters.maxSizeCm) {
                const genericOr: any[] = [];
                if (filters.minSizeCm) genericOr.push({ widthCm: { gte: filters.minSizeCm } }, { heightCm: { gte: filters.minSizeCm } });
                if (filters.maxSizeCm) genericOr.push({ widthCm: { lte: filters.maxSizeCm } }, { heightCm: { lte: filters.maxSizeCm } });
                where.AND = [ ...(where.AND || []), { OR: genericOr } ];
            }

            const [traditionalArtworks, tCount] = await prisma.$transaction([
                prisma.artwork.findMany({ where, skip, take: ITEMS_PER_PAGE }),
                prisma.artwork.count({ where })
            ]);
            
            artworks = traditionalArtworks;
            totalCount = tCount;
        }

        // 4. Memory Pagination & Advanced Filter Sweeps (Year parsing)
        if (filters.minYear || filters.maxYear) {
            const tempFiltered = artworks.filter((art: any) => {
                if (!art.year) return false;
                const match = art.year.match(/\d{4}/);
                if (!match) return false;
                const yearNum = parseInt(match[0], 10);
                if (filters.minYear && yearNum < filters.minYear) return false;
                if (filters.maxYear && yearNum > filters.maxYear) return false;
                return true;
            });
            
            return {
                artworks: tempFiltered.slice(skip, skip + ITEMS_PER_PAGE),
                totalCount: tempFiltered.length,
                aiResponse: filters.aiResponse,
                totalTokensConsumed
            };
        } else {
            // Already paginated dynamically except for Vector 100 limit, so safely re-slice
            return {
                artworks: artworks.slice(0, ITEMS_PER_PAGE),
                totalCount: totalCount,
                aiResponse: filters.aiResponse,
                totalTokensConsumed
            };
        }

    } catch (error: any) {
        console.error("===== FATAL ERROR IN AI PRISMA TRANSLATION =====");
        console.error(error);
        
        // Fallback for non-AI generic string search
        const cleanedQuery = userQuery
            .replace(/["']/g, '') // remove quotes
            .split(' ')
            .filter(word => word.length > 2) // only significant words
            .join(' ');
        const where = {
            OR: [
                { title: { contains: cleanedQuery } },
                { artist: { contains: cleanedQuery } },
                { category: { contains: cleanedQuery } },
                { medium: { contains: cleanedQuery } },
            ]
        };

        const [artworks, totalCount] = await prisma.$transaction([
            prisma.artwork.findMany({
                where,
                skip,
                take: ITEMS_PER_PAGE,
            }),
            prisma.artwork.count({ where })
        ]);

        return { artworks, totalCount, debugError: error.message || String(error) };
    }
}
