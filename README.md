# CommonJS to ES6 module

Change the purescript output file to ES6 modules

# Example

In comes CommonJS:

```js
var a = require('a')

exports.b = 'b'

var c = 'c'
module.exports = { c: c }
```

Out goes ES6 module:

```js
import a from 'a'

var b = 'b'
var c = 'c'

export default {
  b,
  c,
}
```
