'use server';

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Artwork } from '@prisma/client';

// Define the schema for the AI to extract
const SearchFiltersSchema = z.object({
    query: z.string().optional().describe("Text to match against title, artist, or notes (e.g., 'Cuba', 'Red', 'Portrait')"),
    minYear: z.number().optional().describe("Minimum year (e.g., for 'after 2000')"),
    maxYear: z.number().optional().describe("Maximum year (e.g., for 'before 2010')"),
    category: z.string().optional().describe("Category if explicitly mentioned (e.g., 'Painting', 'Sculpture')"),
    minWidthCm: z.number().optional().describe("Minimum width in centimeters. Convert from inches/feet to cm automatically."),
    maxWidthCm: z.number().optional().describe("Maximum width in centimeters. Convert from inches/feet to cm automatically."),
    minHeightCm: z.number().optional().describe("Minimum height in centimeters. Convert from inches/feet to cm automatically."),
    maxHeightCm: z.number().optional().describe("Maximum height in centimeters. Convert from inches/feet to cm automatically."),
});

export async function searchArtworks(userQuery: string, page: number = 1): Promise<{ artworks: Artwork[], totalCount: number }> {
    if (!userQuery.trim()) return { artworks: [], totalCount: 0 };

    const ITEMS_PER_PAGE = 50;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    try {
        // 1. Interpret valid filters safely
        const { object: filters } = await generateObject({
            model: google('gemini-2.0-flash'), // Available model confirmed via API
            schema: SearchFiltersSchema,
            prompt: `
      Identify the user's intent from the query: "${userQuery}".
      
      Extract:
      - query: Key descriptive words (e.g. "Red", "Portrait", "Cuba"). IGNORE generic words like "art", "artworks", "images", "show me", "all", "works".
      - minYear/maxYear: numeric year constraints in standard digits.
      - category: Only if the user explicitly names a category (e.g. "Painting", "Sculpture", "Abstraction").
      - Dimensions: Extrapolate width/height constraints. If a user asks for "larger than 3 feet wide", return minWidthCm: 91.44. If they ask for "under 100 cm tall", return maxHeightCm: 100.
      
      Examples:
      - "abstraction artworks" -> category: "Abstraction"
      - "red paintings from 1990" -> query: "red", category: "Painting", minYear: 1990
      - "Cuba larger than 20 inches wide" -> query: "Cuba", minWidthCm: 50.8
      `,
        });

        console.log('AI Interpreted Filters:', filters);

        // 2. Build Prisma Query
        const where: any = {};

        // Text Search (Multi-column)
        if (filters.query) {
            where.OR = [
                { title: { contains: filters.query, mode: 'insensitive' } },
                { artist: { contains: filters.query, mode: 'insensitive' } },
                { notes: { contains: filters.query, mode: 'insensitive' } },
                { category: { contains: filters.query, mode: 'insensitive' } },
                { medium: { contains: filters.query, mode: 'insensitive' } }, 
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

            return { artworks, totalCount };
        }

    } catch (error) {
        console.error("Search failed:", error);

        // Fallback: Smart cleaning if AI fails
        const cleanedQuery = userQuery
            .replace(/show me|all|artworks|images|works|from|about/gi, '')
            .trim();

        // Fallback Pagination
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

        return { artworks, totalCount };
    }
}
