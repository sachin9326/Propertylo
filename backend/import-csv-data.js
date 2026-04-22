const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const prisma = require('./db');

async function importCsv() {
  console.log('🚀 Starting Real Data Import (CSV)...');

  const csvFilePath = path.join('c:', 'Users', 'Sachin Kumar', 'Mumbai_property_details.csv');
  const results = [];

  // 1. Find the uploader user
  let uploader = await prisma.user.findFirst({ where: { role: 'UPLOADER' } });
  if (!uploader) {
    console.log('👤 Uploader not found, using admin...');
    uploader = await prisma.user.findFirst({ where: { email: 'admin@propertylo.com' } });
  }

  if (!uploader) {
    console.error('❌ No uploader or admin user found. Please run seed-user.js first.');
    return;
  }

  // 2. Wipe existing properties (OPTIONAL: skip if you want to merge)
  console.log('🗑️  Wiping existing properties...');
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.property.deleteMany();

  // 3. Read and Parse CSV
  console.log('📖 Reading CSV file...');
  
  const properties = [];
  let rowCount = 0;
  const MAX_PROPERTIES = 200; // Limit for performance and demo quality

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        if (rowCount >= MAX_PROPERTIES) return;
        // Filter: Keep only those with images
        if (data['Property Image'] && data['Property Image'].trim() !== '') {
          properties.push(data);
          rowCount++;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`✅ Collected ${properties.length} high-quality listings.`);

  // 4. Transform and Insert in Batches
  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < properties.length; i += batchSize) {
    const batch = properties.slice(i, i + batchSize);
    
    const formattedBatch = batch.map((item) => {
      // Price Parsing
      let price = 0;
      const priceStr = (item.Price || '0').replace(/[₹,]/g, '').toLowerCase();
      if (priceStr.includes('lac')) price = parseFloat(priceStr.replace('lac', '').trim()) * 100000;
      else if (priceStr.includes('cr')) price = parseFloat(priceStr.replace('cr', '').trim()) * 10000000;
      else price = parseFloat(priceStr.split('/')[0].trim()) || 0;

      // Area Parsing
      const areaStr = (item.Area || '0').split(' ')[0];
      const areaSqFt = parseFloat(areaStr.replace(/,/g, '').trim()) || 0;

      // BHK
      const bhkVal = item.BHK || '1';
      const bhk = bhkVal.includes('BHK') ? bhkVal.toUpperCase() : `${bhkVal}BHK`;

      // Construct Magicbricks CDN Image URL
      const csvImage = item['Property Image'];
      let realImageUrl = '';
      if (csvImage) {
        if (csvImage.startsWith('http')) {
          realImageUrl = csvImage;
        } else if (csvImage.includes('/')) {
           // Some images are relative paths like 2022/07/...
           realImageUrl = `https://cdn.staticmb.com/property/property_images/${csvImage}`;
        } else {
           realImageUrl = `https://cdn.staticmb.com/property/property_images/${csvImage}`;
        }
      }
      
      const imageUrls = JSON.stringify([realImageUrl]);

      // Category / Type
      let type = (item['Transaction Type'] || 'Rent').toUpperCase() === 'SALE' ? 'BUY' : 'RENT';
      
      // Property Type Mapping
      let propType = item['Property Type'] || 'Flat';
      if (propType === 'Apartment') propType = 'Flat';
      
      // Location Strategy: Use the actual locality from CSV, but set City to Nagpur as requested
      const locality = item.Location || 'Nagpur';
      const dynamicTitle = `${bhk} ${propType} in ${locality}`;

      return {
        title: dynamicTitle,
        description: item.Description || `Beautiful ${bhk} in ${locality}.`,
        address: `${locality}, Nagpur`,
        city: 'Nagpur',
        locality: locality,
        areaSqFt: areaSqFt,
        price: price,
        type: type,
        category: type,
        propertyType: propType,
        bhk: bhk,
        imageUrls: imageUrls,
        isVerified: true,
        isGated: (item.Amenities || '').toLowerCase().includes('gated') || (item.Amenities || '').toLowerCase().includes('security'),
        furnishedStatus: item.Furnished || 'Unfurnished',
        possessionStatus: 'Ready to Move',
        listingType: 'Resale',
        uploaderId: uploader.id,
        updatedAt: new Date()
      };
    });

    try {
      await prisma.property.createMany({
        data: formattedBatch
      });
      successCount += formattedBatch.length;
      process.stdout.write(`\r🚀 Progress: ${successCount}/${properties.length} imported to Neon...`);
    } catch (err) {
      console.error(`\n❌ Error inserting batch:`, err.message);
    }
  }

  console.log(`\n\n✨ SUCCESSFULLY MIGRATED ${successCount} REAL PROPERTIES TO NEON!`);
}

importCsv()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
