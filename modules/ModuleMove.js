
const fs = require('fs');
const BaseModule = require('./BaseModule');
const ModuleCopy = require('./ModuleCopy');
const ModuleDelete = require('./ModuleDelete');

/**
  @input: 1 or more files
  @output: the name of the destination folder
  */
class ModuleMove extends BaseModule {

  constructor(options) {
    super(options);
    this.silent = true;
    this.moveFunc = this.moveFunc.bind(this);
    options.step = this.moveFunc;
    this.setup(options);
  }

  get size() {
    let total = 0;
    for (const fname of this.input) {
      try {
        total += fs.statSync(fname).size;
      } catch (e) {}
    }
    return total;
  }

  moveFunc(input, output, cb) {
    this.copyFunc(input, output, (err1, i, o) => {
      this.delFunc(i, '', err2 => {
        console.log(`Moved file "${input}" in "${output}".`);
        cb(err1 || err2, input, output);
      });
    });
  }

}

ModuleMove.prototype.copyFunc = ModuleCopy.prototype.copyFunc;
ModuleMove.prototype.delFunc = ModuleDelete.prototype.delFunc;

module.exports = ModuleMove;
