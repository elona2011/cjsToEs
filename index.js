const { parseModule } = require('esprima')
const { generate } = require('escodegen')
const { transform } = require('./src/main')

module.exports = function(code) {
  let tree = parseModule(code)

  transform(tree)
  return generate(tree)
}
