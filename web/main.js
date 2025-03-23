import { jsonToByteArray, byteArrayToJson, saveUint8ArrayToFile, prettyPrintJson } from '../src/lib.js';

// JSON to FLT Conversion
document.getElementById('convertToFlt').addEventListener('click', () => {
    try {
        const jsonInput = document.getElementById('jsonInput').value;
        const json = JSON.parse(jsonInput);
        
        // Convert to FLT
        const fltBytes = jsonToByteArray(json);
        
        // Download the FLT file
        saveUint8ArrayToFile(fltBytes, 'filter.flt');
        
        // Show success message
        
        document.getElementById('jsonOutput').textContent = 'Conversion successful! Downloading filter.flt...';
    } catch (error) {
        document.getElementById('jsonOutput').textContent = `Error: ${error.message}`;
    }
});

// FLT to JSON Conversion
document.getElementById('fltUpload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            // Convert ArrayBuffer to Uint8Array
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Convert to JSON
            const json = byteArrayToJson(uint8Array);
            
            // Display the JSON with pretty printing
            document.getElementById('fltOutput').textContent = prettyPrintJson(json, 2, true);
        } catch (error) {
            document.getElementById('fltOutput').textContent = `Error: ${error.message}`;
        }
    };
    reader.readAsArrayBuffer(file);
});