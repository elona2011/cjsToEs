const { parseModule } = require('esprima')
const { transform } = require('../src/main')
const { expect } = require('chai')

describe('simple', () => {
  it('require', () => {
    const input = parseModule(`var a = require('../Data.Semiring');a.b();a.c();a.b();a['d']()`),
      output = parseModule(
        `import {Data_Semiring_b,Data_Semiring_c,Data_Semiring_d} from '../Data.Semiring';Data_Semiring_b();Data_Semiring_c();Data_Semiring_b();Data_Semiring_d()`
      )

    transform(input, 'Data_String')
    expect(input).to.deep.equal(output)
  })
  it('require with keyword', () => {
    const input = parseModule(`var a = require('../Main');a["b'"]();`),
      output = parseModule(`import {Main_b$prime} from '../Main';Main_b$prime();`)

    transform(input)
    expect(input).to.deep.equal(output)
  })
  it('require not use', () => {
    const input = parseModule(`var a = require('a');b()`),
      output = parseModule(`b()`)

    transform(input)
    expect(input).to.deep.equal(output)
  })

  it('export property from other module', () => {
    const input = parseModule(`var a = require('../Main');a.b();module.exports = { b: a.b }`),
      output = parseModule(
        `import {Main_b} from '../Main';Main_b();export var DataString_b =Main_b;`
      )

    transform(input, 'DataString')
    expect(input).to.deep.equal(output)
  })
  it('export local variable', () => {
    const input = parseModule(
        `var a = require('../A.B');a.b();var b = '1';module.exports = { b: b }`
      ),
      output = parseModule(
        `import {A_B_b } from '../A.B';A_B_b();var b='1';export var Data_String_b=b`
      )

    transform(input, 'Data_String')
    expect(input).to.deep.equal(output)
  })
  it('export keyword', () => {
    const input = parseModule(
        `var hasOwnProperty = '1';module.exports = { hasOwnProperty: hasOwnProperty }`
      ),
      output = parseModule(
        `var hasOwnProperty = '1';export var Data_String_hasOwnProperty=hasOwnProperty`
      )

    transform(input, 'Data_String')
    expect(input).to.deep.equal(output)
  })
  it('exports.b', () => {
    const input = parseModule(`exports.b = 'b'`),
      output = parseModule(`export var D_b = 'b'`)

    transform(input, 'D')
    expect(input).to.deep.equal(output)
  })
  it(`exports['_lastIndexOf\\'']`, () => {
    const input = parseModule(`exports['_lastIndexOf\\''] = 'b'`),
      output = parseModule(`export var D__lastIndexOf$prime = 'b'`)

    transform(input, 'D')
    expect(input).to.deep.equal(output)
  })

  it('module.exports', () => {
    const input = parseModule(`var c = 'c';module.exports = { c: c }`),
      output = parseModule(`var c = 'c';export var DataString_c = c`)

    transform(input, 'DataString')
    expect(input).to.deep.equal(output)
  })
  it(`module.exports = {char:$foreign["char'"]}`, () => {
    const input = parseModule(`var $foreign = require('./foreign');module.exports = {c:$foreign["char'"]}`),
      output = parseModule(`import {foreign_char$prime} from './foreign';export var DataString_c = foreign_char$prime`)

    transform(input, 'DataString')
    expect(input).to.deep.equal(output)
  })
  it(`module.exports = {"indexOf'": indexOf$prime,"null": $$null}`, () => {
    const input = parseModule(`module.exports = {"indexOf'": indexOf$prime,"null": $$null}`),
      output = parseModule(
        `export var DataString_indexOf$prime=indexOf$prime;export var DataString_$$null=$$null;`
      )

    transform(input, 'DataString')
    expect(input).to.deep.equal(output)
  })
  it('module.exports = {}', () => {
    const input = parseModule(`module.exports = { }`),
      output = parseModule(``)

    transform(input, 'A')
    expect(input).to.deep.equal(output)
  })
})
