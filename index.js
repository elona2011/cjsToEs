const { parseScript } = require('esprima')
const { generate } = require('escodegen')
const { transform } = require('./src/main')

module.exports = function(code) {
  let tree = parseScript(code),
    newTree = transform(tree)

  return generate(newTree)
}
