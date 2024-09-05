const addBuild = require('../dbActions/addBuild')

class BuildController {

  async addBuild(build) {
    const { discId, project } = build;
    try {
      const payload = {
        discId, project
      }
      return await addBuild(payload)
        .then(result => {
          console.log('Inserted entry:', result.insertId);
          return true
        })
    } catch (error) {
      throw new Error(error?.message ?? String(error))
    }
  }

  // async getConfig (id) {
  //   try {
  //     return await getConfig(id)
  //   } catch (error) {
  //     console.error('Error retrieving config:', error);
  //     res.status(404).send(error.message);
  //   }
  // }
}
const instance = new BuildController()

module.exports = instance