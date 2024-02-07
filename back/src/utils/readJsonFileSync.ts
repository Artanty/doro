const fs = require('fs');

export function readJsonFileSync(filePath: string) {
    try {
        // Read the content of the JSON file synchronously
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Parse the JSON content
        const jsonData = JSON.parse(fileContent);

        return jsonData;
    } catch (error) {
        console.error('Error reading JSON file:', (error as Error).message);
        throw error;
    }
}