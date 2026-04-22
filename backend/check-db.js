const prisma = require('./db');

async function checkData() {
  const allCount = await prisma.property.count();
  console.log('Total properties in DB:', allCount);

  const rentCount = await prisma.property.count({ where: { category: 'RENT' } });
  console.log('Properties with category RENT:', rentCount);

  const saleCount = await prisma.property.count({ where: { category: 'SALE' } });
  console.log('Properties with category SALE:', saleCount);

  const buyCount = await prisma.property.count({ where: { category: 'BUY' } });
  console.log('Properties with category BUY:', buyCount);

  const sample = await prisma.property.findMany({ take: 1 });
  console.log('Sample property:', JSON.stringify(sample, null, 2));
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
