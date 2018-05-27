const { parseModule } = require('esprima')
const { transform } = require('../src/main')
const { expect } = require('chai')

describe('simple', () => {
  it('require', () => {
    const input = parseModule(`var a = require('a');a.b();a.c();a.b();a['d']()`),
      output = parseModule(`import {b as b10000,c as c10001,d as d10002} from 'a';b10000();c10001();b10000();d10002()`)

    transform(input)
    expect(input).to.deep.equal(output)
  })
  it('require not use', () => {
    const input = parseModule(`var a = require('a');b()`),
      output = parseModule(`b()`)

    transform(input)
    expect(input).to.deep.equal(output)
  })
  it('exports.b', () => {
    const input = parseModule(`exports.b = 'b'`),
      output = parseModule(`var b = 'b';export { b}`)

    transform(input)
    expect(input).to.deep.equal(output)
  })
  it('module.exports', () => {
    const input = parseModule(`var c = 'c';module.exports = { c: c }`),
      output = parseModule(`var c = 'c';export {c}`)

    transform(input)
    expect(input).to.deep.equal(output)
  })
  it(`module.exports = {"indexOf'": indexOf$prime,"null": $$null}`, () => {
    const input = parseModule(`module.exports = {"indexOf'": indexOf$prime,"null": $$null}`),
      output = parseModule(`export {indexOf$prime,$$null}`)

    transform(input)
    expect(input).to.deep.equal(output)
  })
  it('module.exports = {}', () => {
    const input = parseModule(`module.exports = { }`),
      output = parseModule(`export {}`)

    transform(input)
    expect(input).to.deep.equal(output)
  })
})
