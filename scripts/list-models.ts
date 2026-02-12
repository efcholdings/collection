
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
        console.error("No API Key found.");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log("Fetching models from:", url.replace(key, 'HIDDEN_KEY'));

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Error fetching models:", response.status, response.statusText);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach((m: any) => console.log(`- ${m.name} (${m.supportedGenerationMethods?.join(', ')})`));
        } else {
            console.log("No models field in response:", data);
        }

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

main();
