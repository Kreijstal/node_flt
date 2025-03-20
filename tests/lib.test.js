const { jsonToFltArgs, fltToJson, normalizeFilter, parseFlt } = require('../src/lib.js');
const { createFlt } = require('../src/utils.js');

/**
 * Detailed object comparison with path tracking
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @param {string} path - Current path in object (for recursion)
 */
function compareObjects(obj1, obj2, path = '') {
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      console.log(`Array length mismatch at ${path}: ${obj1.length} vs ${obj2.length}`);
      return false;
    }
    for (let i = 0; i < obj1.length; i++) {
      compareObjects(obj1[i], obj2[i], `${path}[${i}]`);
    }
    return true;
  }
  
  if (typeof obj1 === 'object' && obj1 !== null && typeof obj2 === 'object' && obj2 !== null) {
    const keys1 = Object.keys(obj1).sort();
    const keys2 = Object.keys(obj2).sort();
    
    if (JSON.stringify(keys1) !== JSON.stringify(keys2)) {
      console.log(`Keys mismatch at ${path}:`, {
        only1: keys1.filter(k => !keys2.includes(k)),
        only2: keys2.filter(k => !keys1.includes(k))
      });
      return false;
    }
    
    for (const key of keys1) {
      compareObjects(obj1[key], obj2[key], path ? `${path}.${key}` : key);
    }
    return true;
  }
  
  if (obj1 !== obj2) {
    console.log(`Value mismatch at ${path}:`, { original: obj1, result: obj2 });
    return false;
  }
  
  return true;
}

/**
 * Sort object keys recursively to ensure consistent ordering
 * @param {Object} obj - Object to sort
 * @returns {Object} - Object with sorted keys
 */
function sortObjectKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((result, key) => {
      result[key] = sortObjectKeys(obj[key]);
      return result;
    }, {});
  }
  return obj;
}
/**
 * Helper function to find differences between objects
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {Object} - Object describing the differences
 */
function findDifferences(obj1, obj2) {
  const differences = {};
  
  for (const key in obj1) {
    if (typeof obj1[key] === 'object' && obj1[key] !== null) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        differences[key] = {
          original: obj1[key],
          result: obj2[key]
        };
      }
    } else if (obj1[key] !== obj2[key]) {
      differences[key] = {
        original: obj1[key],
        result: obj2[key]
      };
    }
  }
  
  for (const key in obj2) {
    if (!(key in obj1)) {
      differences[key] = {
        original: undefined,
        result: obj2[key]
      };
    }
  }
  
  return differences;
}

// Optional: Function to strip default values for cleaner JSON output
function stripDefaults(filter) {
 const stripped = JSON.parse(JSON.stringify(filter));
 
 // Remove head if it matches default
 if (JSON.stringify(stripped.head) === JSON.stringify([0xfe, 0xff, 0xff, 0xff])) {
   delete stripped.head;
 }
 
 // Recursively strip nested groups
 stripped.conditions = stripped.conditions.map(condition => {
   if (condition.type === "group") {
     if (JSON.stringify(condition.head) === JSON.stringify([1])) {
       delete condition.head;
     }
     condition.conditions = stripDefaults({
       operation: condition.operation,
       conditions: condition.conditions
     }).conditions;
   }
   return condition;
 });
 
 return stripped;
}

// Shared test cases for both conversion and fixture tests
const testCases = [
  {
    name: "Simple equals condition",
    filter: {
      operation: "AND",
      conditions: [{
        type: "condition",
        value: "test",
        matchType: "EQUALS",
        row: 1
      }]
    }
  },
  {
    name: "List condition",
    filter: {
      operation: "OR",
      conditions: [{
        type: "condition",
        value: ["A", "B", "C"],
        matchType: "IN_LIST",
        row: 2
      }]
    }
  },
    {
      name: "Complex nested filter",
      filter: {
        operation: "OR",
        conditions: [
          {
            type: "condition",
            value: "prefix%",
            matchType: "LIKE",
            row: 1
          },
          {
            type: "group",
            operation: "AND",
            conditions: [
              {
                type: "condition",
                value: ["X", "Y"],
                matchType: "IN_LIST",
                row: 2
              },
              {
                type: "condition",
                value: "100",
                matchType: "BIGGER_EQUALS",
                row: 3
              }
            ]
          }
        ]
      }
    }
  ];
  /**
 * Test roundtrip conversion with normalization and sorted keys
 */
function testRoundtripConversion() {
  let allTestsPassed = true;

  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: ${testCase.name}`);
    try {
      // Normalize and sort the original filter
      const normalizedOriginal = sortObjectKeys(normalizeFilter(testCase.filter));
      
      // Convert JSON to FLT args
      const fltArgs = jsonToFltArgs(testCase.filter);
      
      // Convert FLT args back to JSON and sort
      const resultJson = sortObjectKeys(fltToJson(fltArgs.getArgs()));
      
      // Compare normalized and sorted versions
      const originalStr = JSON.stringify(normalizedOriginal);
      const resultStr = JSON.stringify(resultJson);
      
      if (originalStr === resultStr) {
        console.log('✅ Test passed: Perfect roundtrip conversion');
        
        // Show the normalized format for reference
        console.log('Normalized format:');
        console.log(JSON.stringify(normalizedOriginal, null, 2));
        
        // Test byte creation
        const bytes = new Uint8Array(createFlt(...fltArgs.getArgs()));
        console.log('Successfully created bytes:', bytes.length, 'bytes');
      } else {
        console.log('❌ Test failed: Conversion mismatch');
        console.log('Original (normalized & sorted):', JSON.stringify(normalizedOriginal, null, 2));
        console.log('Result (sorted):', JSON.stringify(resultJson, null, 2));
        console.log('Detailed comparison:');
        compareObjects(normalizedOriginal, resultJson);
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      allTestsPassed = false;
    }
  });

  console.log('\nFinal Result:', allTestsPassed ? '✅ All tests passed' : '❌ Some tests failed');
  return allTestsPassed;
}

// Run the tests
testRoundtripConversion();

// Test conversion using in-memory test cases
function testFixtureConversions() {
  testCases.forEach((testCase, index) => {
    console.log(`\nTesting Fixture ${index + 1}: ${testCase.name}`);
    
    try {
      // Convert test case filter to FLT bytes
      const fltArgs = jsonToFltArgs(testCase.filter);
      const generatedBytes = new Uint8Array(createFlt(...fltArgs.getArgs()));
      
      // Parse bytes back to FLT args
      const parsedJson = parseFlt(generatedBytes);
      console.log(`✅ Generated ${generatedBytes.length} bytes`);
      console.log(parsedJson)
      
    } catch (error) {
      console.error(`❌ Failed to process fixture:`, error);
      throw error;
    }
  });
}

// Run new tests
testFixtureConversions();