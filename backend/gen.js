const fs = require('fs'); 
const properties = JSON.parse(fs.readFileSync('seed_payload.json', 'utf8')); 

const escape = (str) => {
    if (typeof str !== 'string') return str === null || str === undefined ? 'NULL' : String(str);
    return "'" + str.replace(/'/g, "''") + "'";
};

let sql = `INSERT INTO "User" (id, email, password, name, "quizCompleted", "updatedAt") VALUES (1, 'admin@propertylo.com', 'hash', 'System Admin', false, CURRENT_TIMESTAMP);\n`; 

sql += `INSERT INTO "Property" (id, title, description, address, city, locality, "areaSqFt", price, type, "propertyType", bhk, "imageUrls", "isVerified", "isGated", "furnishedStatus", "category", "uploaderId", "updatedAt", "possessionStatus", "listingType", "isNewLaunch", "isNewBooking", "petFriendly", "nearSchool", "nearPark", "nearMetro", "nearHospital", "views") VALUES `; 

const values = properties.map(p => '(' + p.id + ', ' + escape(p.title) + ', ' + escape(p.description) + ', ' + escape(p.address) + ', ' + escape(p.city) + ', ' + escape(p.locality) + ', ' + p.areaSqFt + ', ' + (p.price || 0) + ', ' + escape(p.type) + ', ' + escape(p.propertyType) + ', ' + escape(p.bhk) + ', ' + escape(p.imageUrls) + ', ' + p.isVerified + ', ' + p.isGated + ', ' + escape(p.furnishedStatus) + ', ' + escape(p.category) + ', ' + p.uploaderId + ', CURRENT_TIMESTAMP, \'\', \'\', false, false, false, false, false, false, false, 0)'); 

sql += values.join(',\n') + ';';  
fs.writeFileSync('seed.sql', sql);
