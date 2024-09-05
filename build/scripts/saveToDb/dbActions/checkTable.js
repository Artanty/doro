const db = require('../core/db_connection')
const removeNewline = require('./../utils/removeNewline')

async function checkTable(tableNames) {

  const queryString = `
  SELECT table_name, COUNT(*) as count
  FROM information_schema.tables 
  WHERE table_schema = ? AND 
  table_name IN (${tableNames.map(tableName => `"${tableName}"`).join(', ')})
  GROUP BY table_name
`;

  return await db.query(removeNewline(queryString));
}

module.exports = checkTable

