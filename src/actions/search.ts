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
});

export async function searchArtworks(userQuery: string, page: number = 1): Promise<{ artworks: Artwork[], totalCount: number }> {
    if (!userQuery.trim()) return { artworks: [], totalCount: 0 };

    const ITEMS_PER_PAGE = 50;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    try {
        // 1. Interpret valid filters safely
        // Since this is a restricted domain, we can be aggressive with structured outputs
        const { object: filters } = await generateObject({
            model: google('gemini-2.0-flash'), // Available model confirmed via API
            schema: SearchFiltersSchema,
            prompt: `
      Identify the user's intent from the query: "${userQuery}".
      
      Extract:
      - query: Key descriptive words (e.g. "Red", "Portrait", "Cuba"). IGNORE generic words like "art", "artworks", "images", "show me", "all", "works".
      - minYear/maxYear: numeric year constraints.
      - category: Only if the user explicitly names a category (e.g. "Painting", "Sculpture", "Abstraction").
      
      Examples:
      - "show me all abstraction artworks" -> category: "Abstraction", query: undefined (ignore "show me all artworks")
      - "red paintings from 1990" -> query: "red", category: "Painting", minYear: 1990
      - "images from Cuba" -> query: "Cuba" (ignore "images from")
      `,
        });

        console.log('AI Interpreted Filters:', filters);

        // 2. Build Prisma Query
        const where: any = {};

        // Text Search (Multi-column)
        if (filters.query) {
            where.OR = [
                { title: { contains: filters.query } },
                { artist: { contains: filters.query } },
                { notes: { contains: filters.query } },
                { category: { contains: filters.query } },
                { medium: { contains: filters.query } }, // Also search medium
            ];
        }

        // Category (if explicitly extracted)
        if (filters.category) {
            // Use startsWith to be more specific (e.g. "Abstraction" shouldn't match "Latin American Abstraction")
            // This aligns better with the user's strict category mental model
            where.category = { startsWith: filters.category };
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
