const { jsonToByteArray, byteArrayToJson, saveUint8ArrayToFile } = require('../src/lib.js');

const jsonFilter = {
  operation: 'OR',
  conditions: [
    {
      type: 'condition',
      value: Array(501).fill(0).map((i,k) => k.toString()),
      matchType: 'IN_LIST',
      row: 44
    }
  ]
};

// Convert JSON to FLT byte array
const fltBuffer = jsonToByteArray(jsonFilter);
console.log('FLT Buffer:', fltBuffer);
saveUint8ArrayToFile(fltBuffer, "fromjson500.flt");

// Convert back to JSON
const convertedJson = byteArrayToJson(fltBuffer);
console.log('Converted JSON:', JSON.stringify(convertedJson, null, 2));