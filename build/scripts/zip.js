const fs = require('fs');
const archiver = require('archiver');
const { upload } = require('./upload')

async function zip() {

  const args = process.argv.slice(2);
  const distFolderPath = args.find(arg => arg.startsWith('--distFolderPath'))?.split('=')[1]; // -> /web/dist/au
  const filePath = distFolderPath + '.zip'; // -> /web/dist/au.zip

  if (!distFolderPath) {
    console.error('File path not provided. Usage: npm run {scriptName} --distFolderPath=/web/dist/au');
    process.exit(1);
  }

  // create a file to stream archive data to.
  const output = fs.createWriteStream(filePath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  // Listen for all archive data to be written
  output.on('close', () => {
    console.log(`Archive created successfully: ${archive.pointer()} total bytes`);
    upload(filePath);
  });

  // Good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn(err.message);
    } else {
      throw err;
    }
  });

  // Good practice to catch this error explicitly
  archive.on('error', (err) => {
    throw err;
  });

  // Pipe archive data to the file
  archive.pipe(output);

  // append files from a sub-directory, putting its contents at the root of archive
  archive.directory(distFolderPath + '/', false); // -> /web/dist/au/

  // Finalize the archive (i.e. we are done appending files but streams have to finish yet)
  archive.finalize();
}

module.exports = { zip }