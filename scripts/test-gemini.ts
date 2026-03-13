import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const Schema = z.object({
    keyword: z.string().optional(),
    minSizeCm: z.number().optional()
});

async function test(query: string) {
    const { object } = await generateObject({
        model: google('gemini-2.0-flash'),
        schema: Schema,
        prompt: `Parse: "${query}". Example: "Cuba over 20 inches" -> { "keyword": "Cuba", "minSizeCm": 50.8 }`,
    });
    console.log(object);
}

test("Images from Cuba larger than 20 inches").catch(console.error);
