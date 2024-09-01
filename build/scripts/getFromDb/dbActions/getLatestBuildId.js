const db = require('../core/db_connection')

async function getLatestBuildId() {
  return await db.query(`SELECT * FROM builds
    ORDER BY id DESC
    LIMIT 1;`);
}

module.exports = getLatestBuildId