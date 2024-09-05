const db = require('../core/db_connection')

async function getLatestBuildId(project) {
  return await db.query(`SELECT * FROM builds
    WHERE project = "${project}"
    ORDER BY id DESC
    LIMIT 1;`);
}

module.exports = getLatestBuildId