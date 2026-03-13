const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const all = await prisma.artwork.findMany({ select: { title: true, artist: true, category: true, notes: true, widthCm: true, heightCm: true } });
  
  const p3 = all.filter(a => {
      if (!a.category) return false;
      const isPainting = a.category.toLowerCase().includes('painting');
      return isPainting && a.widthCm !== null && a.widthCm >= 91.44;
  });
  console.log("Total Paintings >= 91.44 cm width:", p3.length);

  const tall = all.filter(a => a.heightCm !== null && a.heightCm <= 100);
  console.log("Total Artworks <= 100 cm height:", tall.length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
