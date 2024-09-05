const axios = require('axios');
require('dotenv').config();

const db = {

  query: async function (queryString, arrayOfValues = []) {
    // Replace '?' placeholders with actual values
    let formattedQuery = queryString;
    if (arrayOfValues.length) {
      arrayOfValues.forEach(value => {
        formattedQuery = formattedQuery.replace('?', typeof value === 'string' ? `'${value}'` : value);
      });
    }

    const body = {
      app_name: process.env.BAG_SERVICE,
      query: formattedQuery
    };

    try {
      const { data } = await axios.post(`${process.env.BAG_URL}/table-query`, body);
      return data
    } catch (error) {
      if (error.response?.data) {
        // throw new Error('BAG_ERR: ' + error.response.data)
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('BAG_ERR: Connection error. Service might be inactive.')
      }
    }
  }
};

module.exports = db;













































// mysql2 try
// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const pool = mysql.createPool({
//   database: process.env.DB_DATABASE,
// 	user: process.env.DB_USERNAME,
// 	password: process.env.DB_PASSWORD,
// 	host: process.env.DB_HOST,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// module.exports = pool;

// mysql1 try
// const mysql = require('mysql');
// require('dotenv').config();

// // Create a MySQL connection pool
// const pool = mysql.createPool({
//   database: process.env.DB_DATABASE,
//   user: process.env.DB_USERNAME,
//   password: process.env.DB_PASSWORD,
//   host: process.env.DB_HOST,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// // Promisify the pool to use async/await
// const db = {
//   query: (sql, args) => {
//     return new Promise((resolve, reject) => {
//       pool.query(sql, args, (err, results) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(results);
//       });
//     });
//   },
//   close: () => {
//     return new Promise((resolve, reject) => {
//       pool.end(err => {
//         if (err) {
//           return reject(err);
//         }
//         resolve();
//       });
//     });
//   }
// };

// module.exports = db;