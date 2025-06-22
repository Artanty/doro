const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { unzip } = require('./unzip')
require('dotenv').config(); // будет ссылаться на .env файл в папке, из которой запущен, т. е. /web/.env

async function downloadFileFromBackend(fileId, destinationPath) {
  try {
    // Ensure the destination directory exists
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
      console.log('Download destinationDir is created: ' + destinationPath)
    }

    // Send a POST request to the backend server
    const response = await axios.post(process.env.DISC_URL + '/download', {
      fileId: fileId
    }, {
      responseType: 'stream'
    });

    // Create a writable stream to save the file
    const writer = fs.createWriteStream(destinationPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('File downloaded successfully');
        resolve(destinationPath);
      });
      writer.on('error', (err) => {
        console.error('Error writing file', err);
        reject(err);
      });
    });
  } catch (err) {
    console.error('Error downloading file', err.response ? err.response.data : err.message);
    throw err;
  }
}

/**
 * @param { string } fileId 
 */
async function download(fileId) {

  const args = process.argv.slice(2);
  const distFolderPath = args.find(arg => arg.startsWith('--downloadAndUnzipTo'))?.split('=')[1];


  if (!distFolderPath) {
    console.error('File path not provided. Usage: npm run {scriptName} --downloadAndUnzipTo=/dist/counter/assets');
    process.exit(1);
  }

  const destinationPath = path.join(distFolderPath, fileId);

  try {
    const filePath = await downloadFileFromBackend(fileId, destinationPath);
    console.log(`File saved to: ${filePath}`);

    const zipArchivePath = destinationPath;
    const extractPath = distFolderPath;

    await unzip(zipArchivePath, extractPath);
    console.log('Unzip completed successfully');
  } catch (err) {
    console.error('Failed to download or unzip file', err);
  }

}

async function isDiscAlive() {
  try {
    const res = await axios.post(process.env.DISC_URL + '/get-updates', null)
    console.log(res.data.status)
    return true
  } catch (error) {
    console.error('DISC service error: ')
    throw new Error(error.response ? error.response.data : error.message)
  }
}

module.exports = { download, isDiscAlive }