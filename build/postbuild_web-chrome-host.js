const { download } = require('./scripts/download')
const { getLatestBuildId } = require('./scripts/getLatestBuildId')
const { copyFiles } = require('./scripts/copyFiles')

/**
 * Взять id последнего билда AU@
 * Скачать архив билда из DISC@
 */

getLatestBuildId().then(id => {
  download(id).then(() => {
    copyFiles()
  })
})