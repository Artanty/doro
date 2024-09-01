const fs = require('fs');
const path = require('path');

async function copyFiles() {

  // Define source and destination directories
  const srcDir = 'src/extension-files'
  const destDir = 'dist/web-ext-ng-mfe'

  // List of files to copy
  const filesToCopy = ['background.js', 'manifest.json'];

  // Ensure the destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Function to copy a file
  const copyFile = (src, dest) => {
    fs.copyFile(src, dest, (err) => {
      if (err) {
        console.error(`Error copying ${src} to ${dest}:`, err);
      } else {
        console.log(`Copied ${src} to ${dest}`);
      }
    });
  };

  // Copy each file
  filesToCopy.forEach((file) => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    copyFile(srcFile, destFile);
  });
}

module.exports = { copyFiles }