/**
 * Available SQL comparison operations. The numerical values are implementation details and not important.
 * Use this enum to know what options are available.
 */
const MATCH_TYPES = {
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
    "STARTS_WITH":0x24,
    "ENDS_WITH":0x25
  };
  
  /**
   * Maps logical operations to their byte values
   */
  const OPERATIONS = {
    'AND': 0,
    'OR': 1,
    'NAND': 2,
    'NOR': 3
  };
  
  const reverseMapping = (obj) => {
    const reversed = {};
    for (const key in obj) {
      reversed[obj[key]] = key;
    }
    return reversed;
  };

  const MATCH_TYPES_REVERSE = reverseMapping(MATCH_TYPES);
  
  /**
   * Maps byte values to logical operations
   */
  const OPERATIONS_REVERSE = reverseMapping(OPERATIONS);

  module.exports = {
    MATCH_TYPES,
    OPERATIONS,
    MATCH_TYPES_REVERSE,
    OPERATIONS_REVERSE
  };