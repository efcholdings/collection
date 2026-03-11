async function test() {
    const r = await fetch('https://gallery-pilot.vercel.app/api/auth/providers');
    const data = await r.json();
    console.log(r.status, data);
}
test().catch(console.error);
