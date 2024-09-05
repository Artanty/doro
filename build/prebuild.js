const { isTablesExist } = require('./scripts/isTablesExist')
const { isDiscAlive } = require('./scripts/download')

isTablesExist().then(() => {
  isDiscAlive()
})