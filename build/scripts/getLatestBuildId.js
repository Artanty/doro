const { buildController } = require('./../libs/bag')

async function getLatestBuildId() {
  const args = process.argv.slice(2);
  const project = args.find(arg => arg.startsWith('--downloadBuild'))?.split('=')[1];

  if (!project) {
    console.error('Project not provided. Usage: npm run {scriptName} --downloadBuild=DORO');
    process.exit(1);
  }

  return buildController.getLatestBuildId(project)
}

module.exports = { getLatestBuildId }