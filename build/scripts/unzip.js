const fs = require('fs');
const AdmZip = require('adm-zip');

async function unzip(zipFilePath, extractToDir) {
  try {
    // Ensure the extraction directory exists
    if (!fs.existsSync(extractToDir)) {
      fs.mkdirSync(extractToDir, { recursive: true });
      console.log('dir is created')
    }

    // Create a new instance of AdmZip
    const zip = new AdmZip(zipFilePath);

    // Extract all files to the specified directory
    zip.extractAllTo(extractToDir, true);

    console.log(`File unzipped successfully to ${extractToDir}`);
  } catch (err) {
    console.error('Error unzipping file', err);
    throw err;
  }
}

module.exports = { unzip }