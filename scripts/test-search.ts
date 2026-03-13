import { searchArtworks } from '../src/actions/search';

async function run() {
    try {
        console.log("=== Test 2: 'Artworks under 100 cm tall' ===");
        const res2 = await searchArtworks("Artworks under 100 cm tall");
        console.log(`Results: ${res2.totalCount}`);
    } catch(e) {
        console.error("CRITICAL ERROR IN TEST 2:", e);
    }
    
    try {
        console.log("\n=== Test 3: 'Images from Cuba larger than 20 inches' ===");
        const res3 = await searchArtworks("Images from Cuba larger than 20 inches");
        console.log(`Results: ${res3.totalCount}`);
    } catch(e) {
        console.error("CRITICAL ERROR IN TEST 3:", e);
    }
}

run().catch(console.error);
