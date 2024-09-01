const getLatestBuildId = require('../dbActions/getLatestBuildId')

class BuildController {

  /**
   * @param { string } project 
   */
  async getLatestBuildId(project) {
    try {
      const res = await getLatestBuildId(project)
      if (!Array.isArray(res)) { throw new Error('Wrong response format.') }
      if (!res.length) { throw new Error('No build items found in BAG@') }
      return res[0].discId
    } catch (error) {
      console.error('Error retrieving entry: ');
      throw new Error(error?.message ?? String(error))
    }
  }
}
const instance = new BuildController()

module.exports = instance