const { isTablesExist } = require('./scripts/getFromDb')
const { isDiscAlive } = require('./scripts/download')

isTablesExist().then(() => {
  isDiscAlive()
})