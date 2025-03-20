# flt-lib

`flt-lib` is a JavaScript library for creating and manipulating filter byte arrays compatible with Developer Express's FLT format. It allows converting between a JSON-based filter object and the binary FLT format.

## Usage

To convert between FLT files and JSON:

```bash

# Convert a JSON file to FLT (using example.js)
node example.js
```

The library provides functions for converting a JSON filter object to FLT files and vice versa. It supports various comparison operations and logical operations, defined in `constants.js`.

### Example JSON Filter

```json
{
  "operation": "OR",
  "conditions": [
    {
      "type": "condition",
      "value": "prefix%",
      "matchType": "LIKE",
      "row": 1
    },
    {
      "type": "group",
      "operation": "AND",
      "conditions": [
        {
          "type": "condition",
          "value": ["X", "Y"],
          "matchType": "IN_LIST",
          "row": 2
        },
        {
          "type": "condition",
          "value": "100",
          "matchType": "BIGGER_EQUALS",
          "row": 3
        }
      ]
    }
  ]
}
```

## Testing

To run the tests, execute the following command:

```bash
npm test
```

This will run the tests defined in `lib.test.js`.

## CJS Consumer Guide

### Installation
```bash
npm install flt-lib
```

### Core API
```js
const {
  jsonToByteArray, // Convert JSON filter to FLT byte array
  byteArrayToJson, // Convert FLT byte array back to JSON
  saveUint8ArrayToFile, // Save byte array to .flt file
  parseFlt // Parse FLT bytes to JSON
} = require('flt-lib');
```

### Supported Operations and Match Types
The library supports the following operations and match types, defined in `constants.js`:

#### Logical Operations
```js
{
  'AND': 0,
  'OR': 1,
  'NAND': 2,
  'NOR': 3
}
```

#### Comparison Operations (Match Types)
```js
{
  'EQUALS': 0x0,
  'NOT_EQUALS': 0x1,
  'SMALLER': 0x2,
  'SMALLER_EQUALS': 0x3,
  'BIGGER': 0x4,
  'BIGGER_EQUALS': 0x5,
  'LIKE': 0x6,
  'NOT_LIKE': 0x7,
  'BETWEEN': 0x8,
  'NOT_BETWEEN': 0x9,
  'IN_LIST': 0xa,
  'NOT_IN_LIST': 0xb,
  'CONTAINS': 0xe,
  'NOT_CONTAINS': 0xf,
  'STARTS_WITH': 0x24,
  'ENDS_WITH': 0x25
}
```

### Basic Usage
```js
// 1. Create a filter object
const filter = {
  operation: 'OR',
  conditions: [{
    type: 'condition',
    value: ['A', 'B', 'C'],
    matchType: 'IN_LIST',
    row: 2
  }]
};

// 2. Convert to FLT format
const fltBytes = jsonToByteArray(filter);
saveUint8ArrayToFile(fltBytes, 'filter.flt');

// 3. Read and convert back
const restoredFilter = byteArrayToJson(fltBytes);
```

### Advanced Patterns

#### Validation
```js
try {
  const parsed = parseFlt(fltBytes);
} catch (error) {
  console.error('Invalid FLT format:', error);
}
```

### Testing Methodology
The library verifies round-trip conversion integrity:
1. Sort object keys consistently
2. Compare JSON representations
3. Validate binary serialization

Run tests with:
```bash
npm test
```

### Best Practices
1. Validate FLT bytes with `parseFlt()`
2. Prefer `IN_LIST` over multiple `EQUALS` conditions
3. Use groups for complex nested logic