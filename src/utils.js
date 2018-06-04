const path = require('path')

exports.getPathName = pathStr => {
  let pathObj = path.parse(pathStr)
  return pathObj.base.replace(/\./g, '_')
}

exports.validateStr = str => {
  str.trim()
  str = str.replace(/'$/, '$prime')
  str = str.replace(/^null$/, '$$$null')
  return str
}
