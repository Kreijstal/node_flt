const { MATCH_TYPES, OPERATIONS, MATCH_TYPES_REVERSE, OPERATIONS_REVERSE } = require('./constants.js');
const { createFlt } = require('./utils.js');
const { parseFlt } = require('./parser.js');

/**
 * Convert JSON filter to FLT byte array
 * @param {Object} jsonFilter - Filter in JSON format
 * @returns {Uint8Array} - FLT file bytes
 */
function jsonToByteArray(jsonFilter) {
  const args = jsonToFltArgs(jsonFilter).getArgs();
  return createFlt(...args);
}

/**
 * Convert FLT byte array to JSON filter
 * @param {Uint8Array} buffer - FLT file bytes 
 * @returns {Object} - Filter in JSON format
 */
function byteArrayToJson(buffer) {
  return parseFlt(buffer);
}

/**
 * Converts a JSON filter object to arguments for createFlt
 * @param {Object} filter - The filter JSON object
 * @returns {Object} - Arguments ready for createFlt function
 */
function jsonToFltArgs(filter) {
  // Default header if not provided
  //FEFF is BOM marker for UTF16LE
  const head = filter.head || [0xfe, 0xff, 0xff, 0xff];
  
  // Convert operation string to byte value
  const operation = filter.operation ? 
    OPERATIONS[filter.operation.toUpperCase()] : OPERATIONS.AND;

  if (operation === undefined) {
    throw new Error(`Invalid operation: ${filter.operation}. Valid operations are: ${Object.keys(OPERATIONS).join(', ')}`);
  }
  
  // Process conditions into tuples
  const tuples = filter.conditions.map(condition => {
    if (condition.type === "group") {
      // It's a nested group, process recursively
      return [
        1, // Flag for nested filter
        jsonToFltArgs({
          conditions: condition.conditions,
          operation: condition.operation,
          head: condition.head || [1]
        }).tuples,
        OPERATIONS[condition.operation?.toUpperCase()] || OPERATIONS.AND,
        condition.head || [1]
      ];
    } else {
      // Convert match type string to byte value
      const matchType = MATCH_TYPES[condition.matchType.toUpperCase()];
      if (matchType === undefined) {
        throw new Error(`Invalid match type: ${condition.matchType}. Valid types are: ${Object.keys(MATCH_TYPES).join(', ')}`);
      }

      // It's a simple condition for createByteArray
      return [
        0, // Flag for direct condition
        condition.value,
        matchType,
        condition.row || 0
      ];
    }
  });
  
  return {
    tuples,
    operation,
    head,
    getArgs() {
      return [this.tuples, this.operation, this.head];
    }
  };
}


/**
 * Converts FLT arguments back to a JSON filter object
 * @param {Array} tuples - Array of condition tuples
 * @param {number} operation - Operation byte value
 * @param {Array} head - Header bytes
 * @returns {Object} - Filter JSON object
 */
function fltToJson([tuples, operation, head]) {
  return {
    operation: OPERATIONS_REVERSE[operation] || 'AND',
    head: head,
    conditions: tuples.map(tuple => {
      const [flag, ...rest] = tuple;
      
      if (flag === 1) {
        // It's a nested group
        const [nestedTuples, nestedOperation, nestedHead] = rest;
        return {
          type: "group",
          operation: OPERATIONS_REVERSE[nestedOperation],
          head: nestedHead,
          conditions: fltToJson([nestedTuples, nestedOperation, nestedHead]).conditions
        };
      } else {
        // It's a simple condition
        const [value, matchType, row] = rest;
        return {
          type: "condition",
          value: value,
          matchType: MATCH_TYPES_REVERSE[matchType],
          row: row
        };
      }
    })
  };
}

function normalizeFilter(filter) {
  // Deep clone the filter to avoid modifying the original
  const normalized = JSON.parse(JSON.stringify(filter));
  
  // Add default head if not present
  normalized.head = normalized.head || [0xfe, 0xff, 0xff, 0xff];
  //delete normalized.head
  // Recursively normalize nested groups
  normalized.conditions = normalized.conditions.map(condition => {
    if (condition.type === "group") {
      condition.head = condition.head || [1];
      //delete condition.head;
      condition.conditions = normalizeFilter({
        operation: condition.operation,
        conditions: condition.conditions
      }).conditions;
    }
    return condition;
  });
  
  return normalized;
}

async function saveUint8ArrayToFile(uint8Array, filename) {
  // Check if we're in Node.js environment
  if (typeof window === 'undefined') {
      // Node.js implementation
      const fs = require('fs').promises;
      try {
          await fs.writeFile(filename, Buffer.from(uint8Array));
          console.log(`File ${filename} has been saved successfully`);
      } catch (error) {
          console.error('Error saving file:', error);
          throw error;
      }
  } else {
      // Browser implementation
      const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;a
      link.download = filename;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
  }
}

module.exports = {
  jsonToFltArgs,
  saveUint8ArrayToFile,
  fltToJson,
  normalizeFilter,
  createFlt,
  jsonToByteArray,
  byteArrayToJson,
  parseFlt
};
