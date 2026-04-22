const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = require('./db');

async function importData() {
  console.log('🚀 Starting Multi-Source Real Data Import...\n');

  const downloadsDir = path.join('c:', 'Users', 'Sachin Kumar', 'Downloads');
  const filesToImport = [
    'real etate data.json',
    'data 2 real estate.json'
  ];
  
  const mergedProperties = new Map();

  for (const fileName of filesToImport) {
    const fullPath = path.join(downloadsDir, fileName);
    if (fs.existsSync(fullPath)) {
        console.log(`📖 Reading ${fileName}...`);
        const rawData = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(rawData);
        data.forEach(p => {
            // Using ID to ensure no duplicates across files
            mergedProperties.set(p.id, p);
        });
    } else {
        console.log(`⚠️  Warning: File not found: ${fileName}`);
    }
  }

  const properties = Array.from(mergedProperties.values());
  console.log(`\n📄 Total unique properties found: ${properties.length}`);

  // 1. SURGICAL CLEAN: Remove only dummy data and handle repeated entries
  console.log('🧹 Performing Surgical Clean - Removing only dummy data...');
  
  // Define dummy patterns (based on the original seed data)
  const dummyTitles = [
    '3BHK in Kothrud', '1BHK for Rent in Viman Nagar', 'Villa in Baner', 
    'Commercial Shop in Wakad', '2BHK for Rent in Magarpatta', '3BHK in Gachibowli',
    'Villa in Kondapur', '1BHK for Rent near HITEC City', 'Open Plot in Shamirpet'
  ];

  const deletedDummy = await prisma.property.deleteMany({
    where: {
      OR: [
        { title: { in: dummyTitles } },
        { title: { contains: 'Dummy' } },
        { title: { contains: 'Test Property' } }
      ]
    }
  });
  console.log(`✅ Removed ${deletedDummy.count} dummy properties.`);

  // 2. Assign Uploader
  // Use the existing uploader if available, otherwise create/use the admin
  let uploader = await prisma.user.findFirst({ where: { email: 'admin@propertylo.com' } });
  if (!uploader) {
    uploader = await prisma.user.findFirst({ where: { role: 'UPLOADER' } });
  }
  if (!uploader) {
    console.log('👤 Creating System Admin user...');
    uploader = await prisma.user.create({
      data: {
        email: 'admin@propertylo.com',
        password: '$2b$10$YourHashedPasswordHere', 
        name: 'System Admin',
        role: 'UPLOADER'
      }
    });
  }

  let count = 0;
  let updatedCount = 0;

  for (const item of properties) {
    try {
      // 1. Parse Price & Area (same logic)
      let price = 0;
      const priceStr = item.priceRange || '0';
      const cleanPriceStr = priceStr.replace(/[₹,]/g, '').toLowerCase();
      if (cleanPriceStr.includes('lac')) price = parseFloat(cleanPriceStr.replace('lac', '').trim()) * 100000;
      else if (cleanPriceStr.includes('cr')) price = parseFloat(cleanPriceStr.replace('cr', '').trim()) * 10000000;
      else price = parseFloat(cleanPriceStr.split('/')[0].trim()) || 0;

      const areaStr = item.bedrooms || '0'; 
      const areaSqFt = parseFloat(areaStr.replace(/[a-zA-Z,]/g, '').trim()) || 0;

      // 2. Locate existing property to preserve images
      // Using the unique ID from 99acres (if we stored it) or title/address match
      // Note: In our current schema, the ID is an Int, so we might need to store the 99acres ID in a different field
      // For now, let's check by title and address
      const existing = await prisma.property.findFirst({
        where: { title: item.title, address: item.title }
      });

      let images = [];
      if (existing && existing.imageUrls) {
        images = JSON.parse(existing.imageUrls);
      }

      // If no images found, and we want to avoid placeholders for "original" data:
      // We only add placeholders if the user explicitly wants them or if we are in "demo" mode.
      // Given the user's request to NOT erase original data, we'll keep what's there.
      // If none exist, we'll keep it empty or use a very subtle default.
      
      const bhk = item.floorSize || item.title.match(/\d\s*BHK/i)?.[0] || '1 BHK';
      
      let propertyType = 'Flat';
      const titleLower = item.title.toLowerCase();
      if (titleLower.includes('serviced apartment')) propertyType = 'Serviced Apartment';
      else if (titleLower.includes('villa')) propertyType = 'Villa';
      else if (titleLower.includes('bungalow') || titleLower.includes('independent house')) propertyType = 'Independent House';
      else if (titleLower.includes('plot')) propertyType = 'Plot';
      else if (titleLower.includes('penthouse')) propertyType = 'Penthouse';
      else if (titleLower.includes('office')) propertyType = 'Office Space';

      const desc = (item.description || '').toLowerCase();
      const furnishedStatus = desc.includes('fully furnished') ? 'Furnished' : 
                               desc.includes('semi-furnished') ? 'Semi-Furnished' : 'Unfurnished';
      
      const isGated = desc.includes('gated') || desc.includes('society') || desc.includes('security');

      const data = {
        title: item.title,
        description: item.description || `Beautiful ${bhk} ${propertyType} listing.`,
        address: item.title,
        city: 'Mumbai', // Default or extracted
        locality: 'Mumbai', 
        areaSqFt: areaSqFt,
        price: price,
        type: 'RENT',
        category: 'RENT',
        propertyType: propertyType,
        bhk: bhk.toUpperCase().replace(' ', ''),
        imageUrls: JSON.stringify([...new Set(images)]), // Deduplicate images
        uploaderId: uploader.id,
        isVerified: true,
        isGated: isGated,
        furnishedStatus: furnishedStatus,
        createdAt: new Date()
      };

      if (existing) {
        await prisma.property.update({
          where: { id: existing.id },
          data: data
        });
        updatedCount++;
      } else {
        await prisma.property.create({ data: data });
        count++;
      }
    } catch (err) {
      console.error(`❌ Error importing ${item.title}:`, err.message);
    }
  }

  console.log(`\n✅ Finished: ${count} new imported, ${updatedCount} existing updated.`);
  console.log('✨ Data cleaned and synchronized responsibly.');
}

importData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
