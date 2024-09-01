const initController = require('./controllers/initController')
const buildController = require('./controllers/buildController')
/**
 * 1
 * Проверить, существуют ли нужные таблицы в BAG'е
 * 2
 * получить последний идентификатор файла проекта с гугл диска
 */


// 1. Проверить, существуют ли нужные таблицы в BAG'е
async function isTablesExist() {
  return await initController.checkTable()
}

// 2.
async function getFromDb() {
  return await buildController.getLatestBuildId()
}

module.exports = { getFromDb, isTablesExist }