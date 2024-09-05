const TABLES_CONFIG = require('../core/db_tables')
const checkTable = require('../dbActions/checkTable')

class InitController {

  async checkTable(tableName = Object.keys(TABLES_CONFIG)) {

    let count
    if (!tableName || (Array.isArray(tableName) && !tableName.length)) {
      throw new Error('Invalid table names provided.');
    }
    if (!Array.isArray(tableName)) {
      tableName = [tableName]
    }
    count = tableName.length
    try {
      return await checkTable(tableName)
        .then(result => {
          if (!Array.isArray(result)) { throw new Error('checkTable: ' + tableName + '. Wrong response format.') }
          if (result.length !== count) {
            throw new Error(`Tables that don't exist: ${tableName
              .filter(initialTable => !result
                .map(existingTable => existingTable.table_name.replace(`${process.env.BAG_SERVICE}__`, ''))
                .includes(initialTable))
              .join(", ")}\nCreate them to continue.`)
          }
          console.log(`BAG service connected. Required tables exist: ${tableName.join(", ")}`)
          return true
        })
    } catch (error) {
      // console.error(error.message)
      throw new Error(error.message)
    }
  }

}

const instance = new InitController()

module.exports = instance