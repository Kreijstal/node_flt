const { byteArrayToJson } = require('../src/lib');
const fs = require('fs');
const path = require('path');

// Convert all .flt files in current directory
fs.readdirSync('.')
  .filter(f => path.extname(f) === '.flt')
  .forEach(fltFile => {
    const buffer = fs.readFileSync(fltFile);
    const json = byteArrayToJson(new Uint8Array(buffer));
    const jsonFile = `${path.basename(fltFile, '.flt')}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(json, null, 2));
    console.log(`Converted ${fltFile} to ${jsonFile}`);
  });