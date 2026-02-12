
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const SearchFiltersSchema = z.object({
    query: z.string().optional().describe("Text to match against title, artist, or notes (e.g., 'Cuba', 'Red', 'Portrait')"),
    minYear: z.number().optional().describe("Minimum year (e.g., for 'after 2000')"),
    maxYear: z.number().optional().describe("Maximum year (e.g., for 'before 2010')"),
    category: z.string().optional().describe("Category if explicitly mentioned (e.g., 'Painting', 'Sculpture')"),
});

async function main() {
    const userQuery = "show me all abstraction artworks";
    console.log(`Analyzing query: "${userQuery}"...`);

    try {
        const result = await generateObject({
            model: google('gemini-2.0-flash'),
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

        console.log("AI Result:", JSON.stringify(result.object, null, 2));
    } catch (e) {
        console.error("AI Generation Failed:", e);
    }
}

main();
