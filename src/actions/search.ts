'use server';

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Artwork } from '@prisma/client';

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
    maxSizeCm: z.number().optional().describe("CRITICAL: If the user says 'under 20 inches' without specifying width/height, put the converted cm value (50.8) here exactly!")
});

export async function searchArtworks(userQuery: string, page: number = 1): Promise<{ artworks: Artwork[], totalCount: number, debugError?: string }> {
    if (!userQuery.trim()) return { artworks: [], totalCount: 0 };

    const ITEMS_PER_PAGE = 50;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    try {
        // 1. Interpret valid filters safely
        const { object: filters } = await generateObject({
            model: google('gemini-2.0-flash'), // Available model confirmed via API
            schema: SearchFiltersSchema,
            prompt: `
            Extract search intent from: "${userQuery}".
            
            Rules:
            1. keyword: Extract key descriptive words (e.g. "Cuba", "Red"). NEVER include words like "larger", "smaller", "inches", "cm", "feet", "wide", "tall" here!
            2. Dimensions: Convert measurements to centimeters (1 inch = 2.54 cm). 
            3. CRITICAL: If a measurement does not specify width or height (e.g. "larger than 20 inches"), YOU MUST put the converted cm value in minSizeCm (if "larger") or maxSizeCm (if "under").

            Examples:
            - "abstraction artworks" -> { "category": "Abstraction" }
            - "red paintings from 1990" -> { "keyword": "red", "category": "Painting", "minYear": 1990 }
            - "Cuba larger than 20 inches" -> { "keyword": "Cuba", "minSizeCm": 50.8 }
            - "artworks under 100 cm tall" -> { "maxHeightCm": 100 }
            `,
        });

        console.log('AI Interpreted Filters:', filters);

        // 2. Build Prisma Query
        const where: any = {};

        // Text Search (Multi-column)
        if (filters.keyword) {
            where.OR = [
                { title: { contains: filters.keyword, mode: 'insensitive' } },
                { artist: { contains: filters.keyword, mode: 'insensitive' } },
                { notes: { contains: filters.keyword, mode: 'insensitive' } },
                { category: { contains: filters.keyword, mode: 'insensitive' } },
                { medium: { contains: filters.keyword, mode: 'insensitive' } }, 
            ];
        }

        // Category (if explicitly extracted)
        if (filters.category) {
            where.category = { contains: filters.category, mode: 'insensitive' };
        }

        // Dimension Filters (Direct Database Metrics constraint)
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

        // Generic Ambiguous Dimensions
        if (filters.minSizeCm || filters.maxSizeCm) {
            const genericOr: any[] = [];
            
            if (filters.minSizeCm) {
                genericOr.push(
                    { widthCm: { gte: filters.minSizeCm } },
                    { heightCm: { gte: filters.minSizeCm } }
                );
            }
            if (filters.maxSizeCm) {
                genericOr.push(
                    { widthCm: { lte: filters.maxSizeCm } },
                    { heightCm: { lte: filters.maxSizeCm } }
                );
            }
            
            where.AND = [
                ...(where.AND || []),
                { OR: genericOr }
            ];
        }

        // 3. Fetch Data with Pagination
        // Note: For complex post-processing (Year filtering), strict DB-side pagination is hard.
        // If year filters are present, we fetch MORE candidates and filter in memory.
        // Otherwise, we paginate directly on DB.

        if (filters.minYear || filters.maxYear) {
            // Complex Filter Path: Fetch candidates, filter, then slice
            const candidates = await prisma.artwork.findMany({ where, take: 500 }); // Reasonable limit for in-memory processing

            const filtered = candidates.filter((art: Artwork) => {
                if (!art.year) return false;
                const match = art.year.match(/\d{4}/);
                if (!match) return false;
                const yearNum = parseInt(match[0], 10);
                if (filters.minYear && yearNum < filters.minYear) return false;
                if (filters.maxYear && yearNum > filters.maxYear) return false;
                return true;
            });

            return {
                artworks: filtered.slice(skip, skip + ITEMS_PER_PAGE),
                totalCount: filtered.length
            };
        } else {
            // Standard DB Pagination
            const [artworks, totalCount] = await prisma.$transaction([
                prisma.artwork.findMany({
                    where,
                    skip,
                    take: ITEMS_PER_PAGE,
                }),
                prisma.artwork.count({ where })
            ]);

            return { artworks, totalCount, debugError: undefined };
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
