const prisma = require('./db');

async function check() {
  const p = await prisma.property.findMany({ 
    take: 5, 
    orderBy: { id: 'desc' } 
  });
  console.log(JSON.stringify(p.map(x => ({ 
    title: x.title, 
    images: x.imageUrls 
  })), null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
