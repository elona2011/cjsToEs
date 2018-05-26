const estraverse = require('estraverse')

exports.transform = function(tree) {
  let exportsNames = []

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
        return {
          type: 'ImportDeclaration',
          specifiers: [
            {
              type: 'ImportDefaultSpecifier',
              local: node.declarations[0].id,
            },
          ],
          source: node.declarations[0].init.arguments[0],
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
        node.expression.right.type === 'ObjectExpression' &&
        node.expression.right.properties.length
      ) {
        return {
          type: 'ExportDefaultDeclaration',
          declaration: node.expression.right,
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
            type: 'ExportDefaultDeclaration',
            declaration: {
              type: 'ObjectExpression',
              properties: exportsNames.map(n => {
                return {
                  type: 'Property',
                  key: {
                    type: 'Identifier',
                    name: n,
                  },
                  computed: false,
                  value: {
                    type: 'Identifier',
                    name: n,
                  },
                  kind: 'init',
                  method: false,
                  shorthand: false,
                }
              }),
            },
          })
        }
      },
    })
  }
}
