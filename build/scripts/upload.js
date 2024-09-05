const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config(); // будет ссылаться на .env файл в папке, из которой запущен, т. е. /web/.env

// Function to upload the zip file
/**
 * 
 * @param { string } filePath 
 * @returns { fileId: '11Y88rjLzt5pSJmF-gMWEFytJf33jUMY1' }
 */
async function upload(filePath) {

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  try {
    const response = await axios.post(process.env.DISC_URL + '/upload', formData, {
      headers: formData.getHeaders(),
    });

    console.log('File uploaded successfully:', response.data);
    return response.data
  } catch (error) {
    console.error('Error uploading file:', error.response ? error.response.data : error.message);
  }
}

async function isDiscAlive() {
  try {
    const res = await axios.post(process.env.DISC_URL + '/get-updates', null)
    console.log(res.data.status)
    return true
  } catch (error) {
    console.error('DISC service error: ', error.response ? error.response.data : error.message);
  }
}

module.exports = { upload, isDiscAlive }
