const fs = require('fs').promises;

async function saveUint8ArrayToFile(uint8Array, filename) {
    try {
        await fs.writeFile(filename, Buffer.from(uint8Array));
        console.log(`File ${filename} has been saved successfully`);
    } catch (error) {
        console.error('Error saving file:', error);
        throw error;
    }
}

module.exports = {
    saveUint8ArrayToFile
};