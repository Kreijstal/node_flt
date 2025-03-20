const { MATCH_TYPES_REVERSE, OPERATIONS_REVERSE } = require('./constants.js');

/**
 * Parses a UTF-16LE encoded string from a buffer
 * 
 * @param {Uint8Array} buffer - The buffer containing the data
 * @param {number} offset - Starting position within the buffer
 * @param {number} length - Length of the string in characters
 * @returns {string} - The decoded string
 */
function decodeUTF16LE(buffer, offset, length) {
    let result = '';
    const end = offset + length * 2;
    for (let i = offset; i < end; i += 2) {
        const byte1 = buffer[i];
        const byte2 = buffer[i + 1] || 0;
        result += String.fromCharCode((byte2 << 8) | byte1);
    }
    return result;
}

/**
 * Decodes a 32-bit little-endian integer from a buffer
 * 
 * @param {Uint8Array} buffer - The buffer containing the data
 * @param {number} offset - Starting position within the buffer
 * @returns {number} - The decoded integer
 */
function decodeInt32LE(buffer, offset) {
    return buffer[offset] | 
        (buffer[offset + 1] << 8) | 
        (buffer[offset + 2] << 16) | 
        (buffer[offset + 3] << 24);
}

/**
 * Decodes a 16-bit little-endian integer from a buffer
 * 
 * @param {Uint8Array} buffer - The buffer containing the data
 * @param {number} offset - Starting position within the buffer
 * @returns {number} - The decoded integer
 */
function decodeInt16LE(buffer, offset) {
    return buffer[offset] | (buffer[offset + 1] << 8);
}

/**
 * Parses a string from the buffer starting at the given offset
 * 
 * @param {Uint8Array} buffer - The buffer containing the data
 * @param {number} offset - Starting position within the buffer
 * @returns {Object} - Object containing the parsed string and the new offset
 */
function parseString(buffer, offset) {
    // Check for the string marker (0x12)
    if (buffer[offset] !== 0x12) {
        throw new Error(`Expected string marker 0x12 at offset ${offset}, found ${buffer[offset].toString(16)}`);
    }

    // Read the string length (32-bit LE integer)
    const length = decodeInt32LE(buffer, offset + 1);

    // Decode the UTF-16LE string
    const string = decodeUTF16LE(buffer, offset + 5, length);

    // Calculate the new offset: marker (1) + length (4) + string data (length * 2)
    const newOffset = offset + 5 + (length * 2);

    return {
        value: string,
        offset: newOffset
    };
}

/**
 * Parses an array of strings from the buffer starting at the given offset
 * 
 * @param {Uint8Array} buffer - The buffer containing the data
 * @param {number} offset - Starting position within the buffer
 * @returns {Object} - Object containing the parsed array and the new offset
 */
function parseArray(buffer, offset) {
    // Check for the array marker (0x01)
    if (buffer[offset] !== 0x01) {
        throw new Error(`Expected array marker 0x01 at offset ${offset}, found ${buffer[offset].toString(16)}`);
    }

    let arrayLength;
    let nextOffset;

    // Check if it's a standard length (0x02) or extended length (0x03)
    if (buffer[offset + 1] === 0x02) {
        // Standard length - single byte for count
        arrayLength = buffer[offset + 2];
        nextOffset = offset + 3;
    } else if (buffer[offset + 1] === 0x03) {
        // Extended length - 16-bit LE integer for count
        arrayLength = decodeInt16LE(buffer, offset + 2);
        nextOffset = offset + 4;
    } else {
        throw new Error(`Expected array size marker 0x02 or 0x03 at offset ${offset + 1}, found ${buffer[offset + 1].toString(16)}`);
    }

    // Parse each string in the array
    const strings = [];
    for (let i = 0; i < arrayLength; i++) {
        const result = parseString(buffer, nextOffset);
        strings.push(result.value);
        nextOffset = result.offset;
    }

    return {
        value: strings,
        offset: nextOffset
    };
}

/**
 * Parses a condition from the buffer
 * 
 * @param {Uint8Array} buffer - The buffer containing the data
 * @param {number} offset - Starting position within the buffer
 * @returns {Object} - Object containing the parsed condition and the new offset
 */
function parseCondition(buffer, offset) {
    // Check magic string "DXUFMT" (6 ASCII bytes)
    const magicString = String.fromCharCode(...buffer.slice(offset, offset + 6));
    if (magicString !== 'DXUFMT') {
        throw new Error(`Expected magic string "DXUFMT" at offset ${offset}, found "${magicString}"`);
    }
    
    const sqlMatchByte = buffer[offset + 6];
    const stringLength = decodeInt32LE(buffer, offset + 7);
    const vollstr = decodeUTF16LE(buffer, offset + 11, stringLength);
    const row = decodeInt32LE(buffer, offset + 11 + (stringLength * 2));
    
    let nextOffset = offset + 11 + (stringLength * 2) + 4 + 4; // row (4) + padding (4)
    
    let strings, isArray = false;
    if (buffer[nextOffset] === 0x01) {
        const arrayResult = parseArray(buffer, nextOffset);
        strings = arrayResult.value;
        nextOffset = arrayResult.offset;
        isArray = true;
    } else if (buffer[nextOffset] === 0x12) {
        const stringResult = parseString(buffer, nextOffset);
        strings = stringResult.value;
        nextOffset = stringResult.offset;
    } else {
        throw new Error(`Expected array or string marker at offset ${nextOffset}`);
    }
    
    return {
        value: {
            type: 'condition',
            matchType: MATCH_TYPES_REVERSE[sqlMatchByte] || `UNKNOWN(${sqlMatchByte})`,
            row: row,
            value: strings,
            isArray: isArray,
            originalString: vollstr
        },
        offset: nextOffset
    };
}

/**
 * Parses a complete FLT buffer
 * 
 * @param {Uint8Array} buffer - The buffer containing the FLT data
 * @returns {Object} - The parsed FLT structure
 */
function parseFlt(buffer) {
    // Check for potential BOM at the beginning of the file
    let offset = 0;
    if (buffer.length >= 4 && buffer[0] === 0xFE && buffer[1] === 0xFF && buffer[2] === 0xFF && buffer[3] === 0xFF) {
        offset = 4; // Skip BOM
    }
    
    // Parse the entire FLT structure starting from the current offset
    return parseGroup(buffer, offset).value;
}


function parseGroup(buffer, offset) {
    let currentOffset = offset;
    
    // Top-level group header
    const logicalOp = OPERATIONS_REVERSE[buffer[currentOffset]] || `UNKNOWN(${buffer[currentOffset]})`;
    currentOffset += 1;
    const itemCount = decodeInt16LE(buffer, currentOffset); // Uint16LE
    currentOffset += 2;
    
    // Check padding (1 byte)
    if (buffer[currentOffset] !== 0) {
        throw new Error(`Invalid group padding`);
    }
    currentOffset += 1;
    
    const items = [];
    for (let i = 0; i < itemCount; i++) {
        // Check item type marker
        if (buffer[currentOffset] === 0x00 && buffer[currentOffset + 1] === 0x00) { // Condition
            currentOffset += 2; // Skip 00 00
            const result = parseCondition(buffer, currentOffset);
            items.push(result.value);
            currentOffset = result.offset;
        } else if (buffer[currentOffset] === 0x01) { // Nested Group
            currentOffset += 1; // Skip 01
            const result = parseGroup(buffer, currentOffset);
            items.push(result.value);
            currentOffset = result.offset;
        } else {
            throw new Error(`Unexpected item marker: ${buffer[currentOffset]}`);
        }
    }
    
    return {
        value: { type: 'group', operation: logicalOp, items },
        offset: currentOffset
    };
}


module.exports = {
    decodeUTF16LE,
    decodeInt32LE,
    parseFlt
};