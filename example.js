var { jsonToFltArgs, createFlt, fltToJson,  saveUint8ArrayToFile } = require('./lib.js');

// Beispiel für einen Filter in JSON-Format
/*var jsonFilter = {
  operation: 'AND',
  conditions: [
    {
      type: 'condition',
      value: 'Hallo',
      matchType: 'STARTS_WITH',
      row: 0
    },
    {
      type: 'condition',
      value: 'Welt',
      matchType: 'ENDS_WITH',
      row: 1
    },
    {
        type: "group",
        operation: "OR",
        conditions: [
            {
                type: "condition",
                value: "!",
                matchType: "CONTAINS",
                row: 3
            }
        ]
    }
  ]
};*/
var jsonFilter = {
  operation: 'OR',
  conditions: [
    {
      type: 'condition',
      value: Array(501).fill(0).map((i,k)=>k.toString()),
      matchType: 'IN_LIST',
      row: 44
    }]
  }

// Konvertieren des JSON-Filters in FLT-Argumente
var fltArgs = jsonToFltArgs(jsonFilter);
console.log('FLT-Argumente:', fltArgs.getArgs());

// Erstellen des FLT-Filters (Byte-Array)
var fltBuffer = createFlt(...fltArgs.getArgs());
console.log('FLT-Puffer:', fltBuffer);
saveUint8ArrayToFile(fltBuffer,"fromjson500.flt")

// Konvertieren des FLT-Filters zurück in JSON
const convertedJsonFilter = fltToJson(fltArgs.getArgs());
console.log('Konvertierter JSON-Filter:', JSON.stringify(convertedJsonFilter, null, 2));