async function test() {
    console.log("Fetching debug API...");
    try {
        const r = await fetch('https://gallery-pilot.vercel.app/api/debug-users', {
            signal: AbortSignal.timeout(15000)
        });
        const text = await r.text();
        console.log("Status:", r.status);
        console.log("Response:", text);
    } catch(e) {
        console.log("Fetch failed:", e);
    }
}
test();
