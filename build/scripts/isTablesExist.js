const { initController } = require('./../libs/bag')

async function isTablesExist() {
  return initController.checkTable()
}

module.exports = { isTablesExist }