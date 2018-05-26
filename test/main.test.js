const { parseScript } = require('esprima')
const { generate } = require('escodegen')
const { transform } = require('../src/main')

const input = `var a = require('a')

exports.b = 'b'

var c = 'c'
module.exports = { c: c }`

let tree = parseScript(input)

transform(tree)
console.log(tree)
console.log(generate(tree))
