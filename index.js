const { parseModule } = require('esprima')
const { generate } = require('escodegen')
const { transform } = require('./src/main')
const path = require('path')

module.exports = function(code, filePath) {
  let tree = parseModule(code)
  let pathObj = path.parse(filePath)
  let lastDir = /[^/\\]+$/.exec(pathObj.dir)[0].replace(/\./g, '_')
  transform(tree, pathObj.name === 'foreign' ? 'foreign' : lastDir)
  return generate(tree)
}
