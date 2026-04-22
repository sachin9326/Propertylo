const https = require('https');
https.get('https://www.magicbricks.com/property-for-sale/residential-real-estate?bedroom=2&proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName=Mumbai', {
  headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log(d.match(/https:\/\/[^\s\"']+\.jpg/g)?.slice(0, 10) || 'None found'));
});
