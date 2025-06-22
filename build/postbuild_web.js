const { download } = require('./scripts/download')
const { zip } = require('./scripts/zip')
const { getLatestBuildId } = require('./scripts/getLatestBuildId')

/**
 * Взять id последнего билда AU@
 * Скачать архив билда из DISC@
 */

getLatestBuildId().then(id => {
  download(id).then(() => {
    zip()
  })
})