const estraverse = require('estraverse')
const { parseScript } = require('esprima')

const { getPathName, validateStr } = require('./utils')
const { generate } = require('escodegen')

exports.transform = function(tree, folderName) {
  let allExportsNamesArr = Object.entries(getAllExports(tree))
  let allRequiresObj = getAllRequires(tree)

  /**
   * 获取引用模块使用的所有属性名，并在属性名结尾加数字，防止冲突
   * @param {*} tree
   * @param {*} name
   */
  const getAllProperties = (tree, name, preName) => {
    let r = []
    estraverse.replace(tree, {
      enter(node, parent) {
        if (
          node.type === 'MemberExpression' &&
          node.object.type === 'Identifier' &&
          node.object.name === name
        ) {
          let propertyName = validateStr(node.property.name || node.property.value)
          let newName = preName + '_' + propertyName

          if (!r.find(n => n === newName)) {
            r.push(newName)
          }
          return {
            type: 'Identifier',
            name: newName,
          }
        }
      },
    })
    return r
  }

  tree.sourceType = 'module'
  estraverse.replace(tree, {
    enter(node, parent) {
      /**
       * edit require
       */
      if (
        node.type === 'VariableDeclaration' &&
        node.declarations &&
        node.declarations.length &&
        node.declarations[0].type === 'VariableDeclarator' &&
        node.declarations[0].id &&
        node.declarations[0].id.name &&
        node.declarations[0].init &&
        node.declarations[0].init.type === 'CallExpression' &&
        node.declarations[0].init.callee &&
        node.declarations[0].init.callee.type === 'Identifier' &&
        node.declarations[0].init.callee.name === 'require' &&
        node.declarations[0].init.arguments &&
        node.declarations[0].init.arguments.length &&
        node.declarations[0].init.arguments[0].value &&
        node.declarations[0].init.arguments[0].raw
      ) {
        let name = node.declarations[0].id.name
        let preName = getPathName(node.declarations[0].init.arguments[0].value)
        let nameArr = getAllProperties(tree, name, preName)
        if (nameArr.length) {
          return {
            type: 'ImportDeclaration',
            specifiers: nameArr.map(n => ({
              type: 'ImportSpecifier',
              local: {
                type: 'Identifier',
                name: n,
              },
              imported: {
                type: 'Identifier',
                name: n,
              },
            })),
            source: node.declarations[0].init.arguments[0],
          }
        } else {
          this.remove()
        }
      }

      /**
       * edit module.exports
       *
       * module.exports = { b: b, c:a.b}
       * 将转化为
       * export var D_c = a.b
       * export var D_b = b
       *
       * 但如下情况
       * var a = require('../Main');
       * module.exports = { b: a.b }
       * 将转化为
       * import {Main_b} from '../Main';
       * export var D_b =Main_b;
       */
      if (
        node.type === 'ExpressionStatement' &&
        node.expression &&
        node.expression.type === 'AssignmentExpression' &&
        node.expression.operator === '=' &&
        node.expression.left &&
        node.expression.left.type === 'MemberExpression' &&
        node.expression.left.object.type === 'Identifier' &&
        node.expression.left.object.name === 'module' &&
        node.expression.left.property.type === 'Identifier' &&
        node.expression.left.property.name === 'exports' &&
        node.expression.right.type === 'ObjectExpression'
      ) {
        allExportsNamesArr.map(n => {
          let varName = ''

          // 注意不能是Object原型链上的方法
          if (allRequiresObj.hasOwnProperty(n[1][0]) && allRequiresObj[n[1][0]]) {
            varName = getPathName(allRequiresObj[n[1][0]]) + '_' + n[1][1]
          } else {
            varName = n[1].join('.')
          }
          tree.body.push({
            type: 'ExportNamedDeclaration',
            declaration: {
              type: 'VariableDeclaration',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: {
                    type: 'Identifier',
                    name: folderName + '_' + validateStr(n[0]),
                  },
                  init: parseScript(validateStr(varName)).body[0].expression,
                },
              ],
              kind: 'var',
            },
            specifiers: [],
            source: null,
          })
        })
        this.remove()
      }

      // edit exports.b
      if (
        node.type === 'ExpressionStatement' &&
        node.expression &&
        node.expression.type === 'AssignmentExpression' &&
        node.expression.operator === '=' &&
        node.expression.left &&
        node.expression.left.type === 'MemberExpression' &&
        node.expression.left.object.type === 'Identifier' &&
        node.expression.left.object.name === 'exports' &&
        node.expression.left.property &&
        node.expression.right
      ) {
        return {
          type: 'ExportNamedDeclaration',
          declaration: {
            type: 'VariableDeclaration',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: {
                  type: 'Identifier',
                  name:
                    folderName +
                    '_' +
                    validateStr(
                      node.expression.left.property.name || node.expression.left.property.value
                    ),
                },
                init: node.expression.right,
              },
            ],
            kind: 'var',
          },
          specifiers: [],
          source: null,
        }
      }
    },
  })
}

/**
 *
 * @param {*} tree
 */
const getAllExports = tree => {
  let r = {}
  estraverse.replace(tree, {
    enter(node, parent) {
      if (
        node.type === 'ExpressionStatement' &&
        node.expression.type === 'AssignmentExpression' &&
        node.expression.operator === '=' &&
        node.expression.left.type === 'MemberExpression' &&
        node.expression.left.object.type === 'Identifier' &&
        node.expression.left.object.name === 'module' &&
        node.expression.left.property.type === 'Identifier' &&
        node.expression.left.property.name === 'exports' &&
        node.expression.right.type === 'ObjectExpression' &&
        node.expression.right.properties.length
      ) {
        node.expression.right.properties.map(n => {
          let names = []
          let obj = n.value
          while (obj.type === 'MemberExpression') {
            names.push(obj.property.value || obj.property.name)
            if (obj.object) {
              obj = obj.object
            }
          }
          names.push(obj.name)

          r[n.key.name || n.key.value] = names.reverse()
        })
      }
    },
  })
  return r
}

const getAllRequires = tree => {
  let r = {}
  estraverse.replace(tree, {
    enter(node, parent) {
      if (
        node.type === 'VariableDeclaration' &&
        node.declarations &&
        node.declarations.length &&
        node.declarations[0].type === 'VariableDeclarator' &&
        node.declarations[0].id &&
        node.declarations[0].id.name &&
        node.declarations[0].init &&
        node.declarations[0].init.type === 'CallExpression' &&
        node.declarations[0].init.callee &&
        node.declarations[0].init.callee.type === 'Identifier' &&
        node.declarations[0].init.callee.name === 'require' &&
        node.declarations[0].init.arguments &&
        node.declarations[0].init.arguments.length &&
        node.declarations[0].init.arguments[0].value
      ) {
        r[node.declarations[0].id.name] = node.declarations[0].init.arguments[0].value
      }
    },
  })
  return r
}
