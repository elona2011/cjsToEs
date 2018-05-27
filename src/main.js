const estraverse = require('estraverse')

let nameIndex = 10000
exports.transform = function(tree) {
  let exportsNames = []

  tree.sourceType = 'module'
  estraverse.replace(tree, {
    enter(node, parent) {
      // edit require
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

        let nameArr = Object.entries(getAllProperties(tree, name))
        if (nameArr.length) {
          return {
            type: 'ImportDeclaration',
            specifiers: nameArr.map(n => ({
              type: 'ImportSpecifier',
              local: {
                type: 'Identifier',
                name: n[1],
              },
              imported: {
                type: 'Identifier',
                name: n[0],
              },
            })),
            source: node.declarations[0].init.arguments[0],
          }
        } else {
          this.remove()
        }
      }

      // edit module.exports
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
        return {
          type: 'ExportNamedDeclaration',
          declaration: null,
          source: null,
          specifiers: node.expression.right.properties.map(n => ({
            type: 'ExportSpecifier',
            exported: n.value,
            local: n.value,
          })),
        }
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
        node.expression.left.property.type === 'Identifier' &&
        node.expression.left.property.name &&
        node.expression.right
      ) {
        exportsNames.push(node.expression.left.property.name)
        return {
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: node.expression.left.property,
              init: node.expression.right,
            },
          ],
          kind: 'var',
        }
      }
    },
  })
  if (exportsNames.length) {
    estraverse.replace(tree, {
      enter(node, parent) {
        if (node.type === 'Program') {
          node.body.push({
            type: 'ExportNamedDeclaration',
            declaration: null,
            source: null,
            specifiers: exportsNames.map(n => ({
              type: 'ExportSpecifier',
              exported: {
                type: 'Identifier',
                name: n,
              },
              local: {
                type: 'Identifier',
                name: n,
              },
            })),
          })
        }
      },
    })
  }
}

const getAllProperties = (tree, name) => {
  let r = {}
  estraverse.replace(tree, {
    enter(node, parent) {
      if (
        node.type === 'MemberExpression' &&
        node.object.type === 'Identifier' &&
        node.object.name === name
      ) {
        let newName,
          propertyName = node.property.name || node.property.value
          
        if (r[propertyName]) {
          newName = r[propertyName]
        } else {
          newName = propertyName + nameIndex++
        }
        r[propertyName] = newName
        return {
          type: 'Identifier',
          name: newName,
        }
      }
    },
  })
  return r
}
