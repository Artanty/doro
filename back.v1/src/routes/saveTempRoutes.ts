const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const STORAGE_ROOT = path.join(__dirname, '..', 'storage');

// Ensure directory exists
async function ensureDirExists(dirPath: any) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Sanitize path components
function sanitizePath(input: any) {
  return input
    .replace(/\.\./g, '')        // Remove parent directory references
    .replace(/[^\w\-.%]/g, '_')  // Replace special chars with underscore
    .replace(/\/+/g, '/')        // Collapse multiple slashes
    .replace(/^\/|\/$/g, '');    // Trim leading/trailing slashes
}

/**
 * body:
 * path string
 * fileName string
 * file will be saved to:
 * /${env.SAVE_TEMP_FOLDER}/${path}/${fileName}
 * */
router.post('/save', async (req: any, res: any) => {
  try {
    // 1. Validate request body
    const { path: rawPath, fileName, data } = req.body;
    
    if (!rawPath || !fileName || !data) {
      return res.status(400).json({ 
        message: 'path, fileName and data are required' 
      });
    }

    // 2. Sanitize inputs (treating path as literal string)
    const safePath = sanitizePath(rawPath.toString());
    const safeFileName = sanitizePath(fileName.toString());

    // 3. Build storage path
    const storageDir = path.join(STORAGE_ROOT, safePath);
    const filePath = path.join(storageDir, safeFileName);

    // 4. Ensure directory exists
    await ensureDirExists(storageDir);

    // 6. Write to file
    await fs.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    // 7. Respond with success
    res.json({
      success: true,
      message: 'Data saved successfully',
      storagePath: path.relative(STORAGE_ROOT, filePath),
    });

  } catch (error: any) {
    console.error('Error saving data:', error);
    res.status(500).json({
      message: 'Failed to save data',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
});

/**
 * Checks if a file exists at the given path with matching data
 * @param {string} filePath - Full path to the file
 * @param {any} data - Data to compare against file content
 * @returns {Promise<boolean>} - True if file exists and data matches
 */
async function checkFileWithData(filePath: any, dataToCheck: any) {
  try {
    // 1. Check if file exists
    await fs.access(filePath);
    
    // 2. Read file content
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // 3. Compare stringified data
    const currentData = JSON.parse(fileContent);
    // return JSON.stringify(currentData) === JSON.stringify(dataToCheck);
    return currentData.token === dataToCheck.token
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist
      return false;
    }
    throw error; // Re-throw other errors
  }
}

 
// export interface CheckTokenReq {
//   hostOrigin: string - адрес хоста, который нужно переслать
//   data: { token: string, hostOrigin; string } 
// }

router.post('/check', async (req: any, res: any) => {

  const hostOrigin = req.body.hostOrigin;
  const fileName = `token.json`;
  const dataToCompare = req.body.data
 
  const encodedHostOrigin_forPath = encodeURIComponent(hostOrigin) // передлать на получение его из запроса?


  // 2. Sanitize inputs (treating path as literal string)
  const safePath = sanitizePath(encodedHostOrigin_forPath.toString());
  const safeFileName = sanitizePath(fileName.toString());

  // 3. Build storage path
  const storageDir = path.join(STORAGE_ROOT, safePath);
  const filePath = path.join(storageDir, safeFileName);

  
  const validateResult = await checkFileWithData(filePath, dataToCompare)

  // http%3A%2F%2Flocalhost%3A4222
  // http%3A%2F%2Flocalhost%3A4222
  res.json({
    // PORT: process.env.PORT,
    // hostOrigin,
    // encodedHostOrigin_forPath,
    // safePath,
    // safeFileName,
    // storageDir,
    // filePath,
    // dataToCompare,
    validateResult,
  });

})

export default router;