const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config(); // будет ссылаться на .env файл в папке, из которой запущен, т. е. /web/.env

// Function to upload the zip file
async function upload(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  console.log(formData)
  console.log(formData.getHeaders())
  try {
    const response = await axios.post(process.env.DISC_URL + '/upload', formData, {
      headers: formData.getHeaders(),
    });

    console.log('File uploaded successfully:', response.data);
  } catch (error) {
    console.error('Error uploading file:', error.response ? error.response.data : error.message);
  }
}

module.exports = { upload }
