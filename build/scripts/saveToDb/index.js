const initController = require('./controllers/initController')
const buildController = require('./controllers/buildController')
/**
 * 1
 * Проверить, существуют ли нужные таблицы в BAG'е
 * 1.1
 * Если нет - создать их
 * 2
 * сохранить присвоенный файлу google drive идентификатор в таблицу
 */


// 1. Создать таблицы в BAG'е
// СОЗДАЕМ ТОЛЬКО РУКАМИ
async function createTables() {
  return await initController.createTables()
}

// 2. Проверить, существуют ли нужные таблицы в BAG'е
async function isTablesExist() {
  return await initController.checkTable()
}

async function saveToDb(build) {
  return await buildController.addBuild(build)

}

module.exports = { saveToDb, isTablesExist }