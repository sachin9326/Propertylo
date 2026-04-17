const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = require('./db');

async function importData() {
  console.log('🚀 Starting Real Data Import...\n');

  const jsonPath = path.join('c:', 'Users', 'Sachin Kumar', 'Downloads', 'real etate data.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: File not found at ${jsonPath}`);
    return;
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const properties = JSON.parse(rawData);

  console.log(`📄 Found ${properties.length} properties in JSON.`);

  // Get or Create a default uploader
  let uploader = await prisma.user.findFirst({ where: { role: 'UPLOADER' } });
  if (!uploader) {
    uploader = await prisma.user.findFirst(); // Just use anyone if no uploader role found
  }

  if (!uploader) {
      console.log('⚠️ No user found to assign as uploader. Please seed users first.');
      return;
  }

  // Clear existing properties (to avoid duplicates and provide "fresh" data)
  console.log('🗑️  Clearing existing property data...');
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.property.deleteMany();

  let count = 0;
  for (const item of properties) {
    try {
      // 1. Parse Price
      let price = 0;
      const priceStr = item.priceRange || '0';
      const cleanPriceStr = priceStr.replace(/[₹,]/g, '').toLowerCase();
      
      if (cleanPriceStr.includes('lac')) {
        price = parseFloat(cleanPriceStr.replace('lac', '').trim()) * 100000;
      } else if (cleanPriceStr.includes('cr')) {
        price = parseFloat(cleanPriceStr.replace('cr', '').trim()) * 10000000;
      } else {
        price = parseFloat(cleanPriceStr.split('/')[0].trim()) || 0;
      }

      // 2. Parse Area
      const areaStr = item.bedrooms || '0'; // Based on JSON sample, area is in 'bedrooms' field
      const areaSqFt = parseFloat(areaStr.replace(/[a-zA-Z,]/g, '').trim()) || 0;

      // 3. Extract Locality and City from Title
      // e.g. "3 BHK Serviced Apartment for rent in Hiranandani Gardens Powai, Mumbai"
      let locality = 'Mumbai';
      let city = 'Mumbai';
      let address = item.title;

      const splitMatch = item.title.match(/in (.*)/i);
      if (splitMatch && splitMatch[1]) {
        const parts = splitMatch[1].split(',');
        if (parts.length >= 2) {
          locality = parts[0].trim();
          city = parts[1].trim();
        } else if (parts.length === 1) {
          locality = parts[0].trim();
        }
      }

      // 4. Extract BHK
      const bhk = item.floorSize || item.title.match(/\d\s*BHK/i)?.[0] || '1BHK';

      // 5. Images (Use nice placeholders)
      const images = [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
      ];
      const selectedImg = images[Math.floor(Math.random() * images.length)];

      await prisma.property.create({
        data: {
          title: item.title,
          description: item.description || 'Premium property listed in ' + locality,
          address: address,
          city: city,
          locality: locality,
          areaSqFt: areaSqFt,
          price: price,
          type: 'RENT',
          category: 'RENT',
          propertyType: item.propertyType ? item.propertyType.split(' ')[2] : 'Flat',
          bhk: bhk.toUpperCase().replace(' ', ''),
          imageUrls: JSON.stringify([selectedImg]),
          uploaderId: uploader.id,
          isVerified: true,
          isGated: Math.random() > 0.3,
          furnishedStatus: 'Semi-Furnished',
          parking: 'Covered',
          floor: 'High',
          createdAt: new Date()
        }
      });
      count++;
    } catch (err) {
      console.error(`❌ Error importing ${item.title}:`, err.message);
    }
  }

  console.log(`\n✅ Successfully imported ${count} properties!`);
  console.log('✨ Your website is now showing real property data.');
}

importData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
