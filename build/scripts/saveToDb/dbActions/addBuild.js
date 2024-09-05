const db = require('../core/db_connection')

async function addBuild(build) {
  const { discId, project } = build
  return await db.query(`INSERT INTO builds (discId, project) 
  VALUES ("${discId}", "${project}")`);
}

module.exports = addBuild