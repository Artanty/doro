const fs = require('fs');
const path = require('path');

async function copyFiles() {
  let srcDir
  let destDir
  // --copySrc=../build/extension-files --copyDest=dist/counter
  const args = process.argv.slice(2);
  const source = args.find(arg => arg.startsWith('--copySrc'))?.split('=')[1];
  const dest = args.find(arg => arg.startsWith('--copyDest'))?.split('=')[1];

  if (!source || !dest) {
    throw new Error('arguments not provided to copyFiles func')
  } else {
    srcDir = source
    destDir = dest
  }

  // Define source and destination directories



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