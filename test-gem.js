require('dotenv').config();
const key = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

async function run() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requests: [{
                model: "models/gemini-embedding-001",
                content: { parts: [{ text: "Hello world" }] }
            }]
        })
    });
    console.log(response.status);
    console.log(await response.text());
}
run();
