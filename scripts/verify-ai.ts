
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("Testing Google AI API with key ending in:", process.env.GOOGLE_GENERATIVE_AI_API_KEY?.slice(-4));

    try {
        const models = ['gemini-pro', 'gemini-1.5-flash-001', 'gemini-1.0-pro'];

        for (const modelName of models) {
            console.log(`\nTesting model: ${modelName}`);
            try {
                const result = await generateText({
                    model: google(modelName),
                    prompt: 'Hello, are you working?',
                });
                console.log(`SUCCESS with ${modelName}! Response:`, result.text);
                return; // Exit on first success
            } catch (e: any) {
                console.error(`FAILED with ${modelName}:`, e.message || e);
            }
        }
    } catch (e) {
        console.error("API Error:", e);
    }
}

main();
