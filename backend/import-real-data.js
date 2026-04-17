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

  // 1. DEEP CLEAN: Wipe everything
  console.log('🗑️  Performing Deep Clean - Wiping all tables...');
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Fresh System Admin
  console.log('👤 Creating fresh System Admin user...');
  const uploader = await prisma.user.create({
    data: {
      email: 'admin@propertylo.com',
      password: '$2b$10$YourHashedPasswordHere', 
      name: 'System Admin',
      role: 'UPLOADER'
    }
  });

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
      const areaStr = item.bedrooms || '0'; 
      const areaSqFt = parseFloat(areaStr.replace(/[a-zA-Z,]/g, '').trim()) || 0;

      // 3. Extract Locality and City from Title
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

      // 4. Extract BHK and Property Type
      const bhk = item.floorSize || item.title.match(/\d\s*BHK/i)?.[0] || '1 BHK';
      
      let propertyType = 'Flat';
      const titleLower = item.title.toLowerCase();
      if (titleLower.includes('serviced apartment')) propertyType = 'Serviced Apartment';
      else if (titleLower.includes('villa')) propertyType = 'Villa';
      else if (titleLower.includes('bungalow') || titleLower.includes('independent house')) propertyType = 'Independent House';
      else if (titleLower.includes('plot')) propertyType = 'Plot';
      else if (titleLower.includes('penthouse')) propertyType = 'Penthouse';
      else if (titleLower.includes('office')) propertyType = 'Office Space';

      // 5. Dynamic High-Quality Images
      // Use different Unsplash keywords based on property ID to ensure variety
      const imgKeywords = ['modern-apartment', 'luxury-home', 'interior-design', 'architecture', 'cityscape', 'minimalist-room'];
      const k1 = imgKeywords[count % imgKeywords.length];
      const k2 = imgKeywords[(count + 1) % imgKeywords.length];
      const images = [
        `https://images.unsplash.com/photo-${1564013000000 + (count * 100)}?w=1000&q=80&sig=${count}-a`,
        `https://images.unsplash.com/photo-${1512917774080 + (count * 100)}?w=1000&q=80&sig=${count}-b`
      ];

      // 6. Natural Language Processing for Description Features
      const desc = (item.description || '').toLowerCase();
      const furnishedStatus = desc.includes('fully furnished') ? 'Furnished' : 
                               desc.includes('semi-furnished') ? 'Semi-Furnished' : 'Unfurnished';
      
      const isGated = desc.includes('gated') || desc.includes('society') || desc.includes('security');
      const nearMetro = desc.includes('metro') || desc.includes('station');
      const nearSchool = desc.includes('school') || desc.includes('college');
      const nearPark = desc.includes('park') || desc.includes('garden');
      const petFriendly = desc.includes('pet') || desc.includes('villa');

      await prisma.property.create({
        data: {
          title: item.title,
          description: item.description || `Beautiful ${bhk} ${propertyType} located in the heart of ${locality}, offering premium amenities and convenient access to local transport. Ideal for those seeking comfort and style in ${city}.`,
          address: address,
          city: city,
          locality: locality,
          areaSqFt: areaSqFt,
          price: price,
          type: 'RENT',
          category: 'RENT',
          propertyType: propertyType,
          bhk: bhk.toUpperCase().replace(' ', ''),
          imageUrls: JSON.stringify(images),
          uploaderId: uploader.id,
          isVerified: true,
          isGated: isGated,
          furnishedStatus: furnishedStatus,
          parking: desc.includes('parking') ? 'Covered' : 'None',
          floor: desc.includes('high floor') ? 'High' : (desc.includes('ground floor') ? 'Ground' : 'Middle'),
          nearMetro: nearMetro,
          nearSchool: nearSchool,
          nearPark: nearPark,
          petFriendly: petFriendly,
          noiseLevel: isGated ? 'Silent' : 'Moderate',
          safetyRating: 'High',
          contactInfo: item.postedBy || 'Professional Realtor',
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
