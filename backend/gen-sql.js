const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function generateSql() {
  const csvFilePath = path.join('c:', 'Users', 'Sachin Kumar', 'Mumbai_property_details.csv');
  const properties = [];
  let rowCount = 0;
  const MAX_PROPERTIES = 50; // Keep it small for transaction tool limits

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        if (rowCount >= MAX_PROPERTIES) return;
        if (data['Property Image'] && data['Property Image'].trim() !== '') {
          properties.push(data);
          rowCount++;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const sqlStatements = [
      "DELETE FROM \"Favorite\";",
      "DELETE FROM \"Review\";",
      "DELETE FROM \"Visit\";",
      "DELETE FROM \"Property\";"
  ];

  // 1. Get UPLOADER id (assuming it's 1 or we'll fetch it later)
  // For now, let's assume valid uploaderId = 1 or find first user
  const uploaderId = 1;

  for (const item of properties) {
    let price = 0;
    const priceStr = (item.Price || '0').replace(/[₹,]/g, '').toLowerCase();
    if (priceStr.includes('lac')) price = parseFloat(priceStr.replace('lac', '').trim()) * 100000;
    else if (priceStr.includes('cr')) price = parseFloat(priceStr.replace('cr', '').trim()) * 10000000;
    else price = parseFloat(priceStr.split('/')[0].trim()) || 0;

    const areaStr = (item.Area || '0').split(' ')[0];
    const areaSqFt = parseFloat(areaStr.replace(/,/g, '').trim()) || 0;

    const bhkVal = item.BHK || '1';
    const bhk = bhkVal.includes('BHK') ? bhkVal.toUpperCase() : `${bhkVal}BHK`;

    const csvImage = item['Property Image'];
    let realImageUrl = `https://cdn.staticmb.com/property/property_images/${csvImage}`;
    const imageUrls = JSON.stringify([realImageUrl]);

    let type = (item['Transaction Type'] || 'Rent').toUpperCase() === 'SALE' ? 'BUY' : 'RENT';
    let propType = item['Property Type'] || 'Flat';
    if (propType === 'Apartment') propType = 'Flat';
    
    const locality = item.Location || 'Nagpur';
    const dynamicTitle = `${bhk} ${propType} in ${locality}`;
    const desc = (item.Description || `Beautiful ${bhk} in ${locality}.`).replace(/'/g, "''");
    const addr = `${locality}, Nagpur`.replace(/'/g, "''");
    const loc = locality.replace(/'/g, "''");
    const title = dynamicTitle.replace(/'/g, "''");

    const sql = `INSERT INTO "Property" ("title", "description", "address", "city", "locality", "areaSqFt", "price", "type", "category", "propertyType", "bhk", "imageUrls", "isVerified", "isGated", "furnishedStatus", "possessionStatus", "listingType", "uploaderId", "updatedAt") VALUES ('${title}', '${desc}', '${addr}', 'Nagpur', '${loc}', ${areaSqFt}, ${price}, '${type}', '${type}', '${propType}', '${bhk}', '${imageUrls}', true, false, '${item.Furnished || 'Unfurnished'}', 'Ready to Move', 'Resale', ${uploaderId}, NOW());`;
    sqlStatements.push(sql);
  }

  fs.writeFileSync('seed_payload.json', JSON.stringify(sqlStatements, null, 2));
  console.log(`✅ Generated ${sqlStatements.length} SQL statements in seed_payload.json`);
}

generateSql();
