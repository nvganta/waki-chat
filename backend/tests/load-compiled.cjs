const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load the built application with explicit substitutes; unexpected imports fail closed.
module.exports = function load(relative, imports, env = {}) {
  const filename = path.join(__dirname, '../dist', relative);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, Date, Buffer, __dirname: path.dirname(filename),
    console: { log() {}, error() {} }, process: { env },
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
      return imports[name];
    },
  }, { filename });
  return module.exports;
};
