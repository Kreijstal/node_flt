//const { MATCH_TYPES, OPERATIONS } = require('./constants.js');

function encodeUTF16LE(str) {
    // Create a byte array with 2 bytes per character
    const byteArray = new Uint8Array(str.length * 2);
    
    for (let i = 0; i < str.length; i++) {
        const codeUnit = str.charCodeAt(i);
        // Store the low byte first (LE = Little Endian)
        byteArray[i * 2] = codeUnit & 0xFF;
        // Store the high byte second
        byteArray[i * 2 + 1] = codeUnit >> 8;
    }
    
    return byteArray;
}

function encodeInt32LE(value) {
    // Create a buffer of 4 bytes (32 bits)
    const bytes = new Uint8Array(4);
    
    // Write the value to the array in little-endian format
    bytes[0] = value & 0xFF;           // Least significant byte
    bytes[1] = (value >> 8) & 0xFF;    // Second byte
    bytes[2] = (value >> 16) & 0xFF;   // Third byte
    bytes[3] = (value >> 24) & 0xFF;   // Most significant byte
    
    return bytes;
}
function encodeInt16LE(value) {
    // Create a buffer of 4 bytes (32 bits)
    const bytes = new Uint8Array(2);
    
    // Write the value to the array in little-endian format
    bytes[0] = value & 0xFF;           // Least significant byte
    bytes[1] = (value >> 8) & 0xFF;    // Second byte
    
    return bytes;
}
function createByteArray(strings, sqlmatch,row) {
    const encoder = new TextEncoder();
    
    // Prepare the string content
    const isArray = Array.isArray(strings);
    const vollstr = isArray ? strings.join(";") : strings;
    
    // Build the header part
    const header = [
        0x00, 0x00,                         // File header initial bytes
        ...encoder.encode('DXUFMT'),        // Magic string, this is Developer Express Unicode FMT string, non unicode is DXAFMT.
			//0 is equal
	//1 is not equal
	//2 is smaller
	//3 is smallerequal
	//4 is bigger
	//5 is biggerequal
	//6 is like
	//7 is not like
		 //  0a => in list, 0b => not in list, 06=> LIKE, 0e => contains
        sqlmatch,                          // SQL match type (0a, 0b, 06, 0e)
        ...encodeInt32LE(vollstr.length)    // String length
    ];
    
    // Build the middle part with the encoded string
    //we should assert row is not 0, it starts at 1
    const middle = [
        ...encodeUTF16LE(vollstr),          // UTF-16LE encoded string
        ...encodeInt32LE(row),
        0x00, 0x00, 0x00, 0x00              // 64-bit integer padding
    ];
    
    // Build the array part if input is an array
    const arrayPart = isArray 
        ? (strings.length<0x80?[0x01, 0x02, strings.length]:[0x01, 0x03, ...encodeInt16LE(strings.length)])
        : [];
    
    // Build the strings part
    const stringsPart = isArray
        ? Array.prototype.concat.apply([], strings.map(string => [
            0x12, 
            ...encodeInt32LE(string.length),
            ...encodeUTF16LE(string)
          ])) //if not array it is a string.
        : [0x12,...encodeInt32LE(strings.length),...encodeUTF16LE(strings)];
    
    // Combine all parts and return as Uint8Array
    return new Uint8Array([
        ...header,
        ...middle,
        ...arrayPart,
        ...stringsPart
    ]);
}
//
function createFlt(tuples,operation,head) {
     //oepration 0=>and, 1=or 2=nand, 3=nor
    // Create the FLT header
    const header = [...head, operation, tuples.length, 0x00, 0x00];
    
    // Process each tuple into a byte array and flatten the result
    const processedTuples = tuples.flatMap(tuple => {
	    var fall=tuple.shift();
		if (fall==0){
        return Array.from(createByteArray(...tuple))
		}else {//fall=1
		return Array.from(createFlt(...tuple,[1]))}
		}
    );
    
    // Combine header and processed tuples
    return [...header, ...processedTuples];
}

module.exports = {
    encodeUTF16LE,
    encodeInt32LE,
    createByteArray,
    createFlt
};