const { download } = require('./scripts/download')
const { getFromDb } = require('./scripts/getFromDb')
const { copyFiles } = require('./scripts/copyFiles')

getFromDb().then((id) => {
  download(id).then(() => {
    copyFiles()
  })
})
