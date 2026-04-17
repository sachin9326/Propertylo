const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const prisma = require('./db');

async function importCsv() {
  console.log('🚀 Starting Mumbai CSV Data Import...');

  const csvFilePath = path.join('c:', 'Users', 'Sachin Kumar', 'Mumbai_property_details.csv');
  const results = [];

  // 1. Find the uploader user
  let uploader = await prisma.user.findUnique({ where: { email: 'sachin@gmail.com' } });
  if (!uploader) {
    console.log('👤 Uploader not found, creating user...');
    const bcrypt = require('bcrypt');
    uploader = await prisma.user.create({
      data: {
        email: 'sachin@gmail.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Sachin Kumar',
        role: 'UPLOADER',
      },
    });
  }

  // 2. Wipe existing properties
  console.log('🗑️  Wiping existing properties...');
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.property.deleteMany();

  // 3. Read and Parse CSV
  console.log('📖 Reading CSV file...');
  
  const properties = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // Filter: Keep only those with images
        if (data['Property Image'] && data['Property Image'].trim() !== '') {
          properties.push(data);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`✅ Found ${properties.length} properties with images.`);

  // 4. Transform and Insert in Batches
  const batchSize = 100;
  let successCount = 0;

  for (let i = 0; i < properties.length; i += batchSize) {
    const batch = properties.slice(i, i + batchSize);
    
    const formattedBatch = batch.map(item => {
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

      // Image Fallbacks
      const heroImages = [
        '/uploads/hero/premium_villa.png',
        '/uploads/hero/modern_apartment.png',
        '/uploads/hero/penthouse_terrace.png'
      ];
      const randomHero = heroImages[Math.floor(Math.random() * heroImages.length)];
      
      // Property Image from CSV (could be multiple if we split, but looks like single in samples)
      const csvImage = item['Property Image'];
      const imageUrls = JSON.stringify([randomHero, csvImage]);

      // Category / Type
      const type = (item['Transaction Type'] || 'Rent').toUpperCase() === 'SALE' ? 'SALE' : 'RENT';

      // Gated
      const isGated = (item.Amenities || '').toLowerCase().includes('gated') || 
                      (item.Amenities || '').toLowerCase().includes('security');

      // Property Type Mapping
      let propType = item['Property Type'] || 'Flat';
      if (propType === 'Apartment') propType = 'Flat';
      
      return {
        title: item.Title || 'Property Listing',
        description: item.Description || `Beautiful ${bhk} in ${item.Location || 'Mumbai'}.`,
        address: item.Title || 'Mumbai',
        city: 'Mumbai',
        locality: item.Location || 'Mumbai',
        areaSqFt: areaSqFt,
        price: price,
        type: type,
        category: type,
        propertyType: propType,
        bhk: bhk,
        imageUrls: imageUrls,
        isVerified: true,
        isGated: isGated,
        furnishedStatus: item.Furnished || 'Unfurnished',
        floor: item.Floor || 'Medium',
        uploaderId: uploader.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    try {
      await prisma.property.createMany({
        data: formattedBatch
      });
      successCount += formattedBatch.length;
      process.stdout.write(`\r🚀 Progress: ${successCount}/${properties.length} imported...`);
    } catch (err) {
      console.error(`\n❌ Error inserting batch:`, err.message);
    }
  }

  console.log(`\n\n✨ SUCCESSFULLY IMPORTED ${successCount} PROPERTIES!`);
}

importCsv()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
