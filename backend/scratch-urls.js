const https = require('https');
const fs = require('fs');
const csv = require('csv-parser');
let i = 0;
fs.createReadStream('c:/Users/Sachin Kumar/Mumbai_property_details.csv')
  .pipe(csv())
  .on('data', d => {
    if (d['Property Image'] && i < 10) {
      let f = d['Property Image'].replace(/_\d+_(?=PropertyImage)/, '_');
      let u = 'https://img.staticmb.com/mbimages/property/Photo_h310_w462/' + f;
      https.get(u, res => console.log(res.statusCode, u)).on('error', () => {});
      i++;
    }
  });
