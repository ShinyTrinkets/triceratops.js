
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
    options.stepFunc = this.moveFunc;
    this.setup(options);
  }

  moveFunc(input, output, cb) {
    this.copyFunc(input, output, (err1, i, o) => {
      this.delFunc(i, '', err2 => {
        console.log(`Moved file "${i}" in "${o}".`);
        cb(err1 && err2, i, o);
      });
    });
  }

}

ModuleMove.prototype.copyFunc = ModuleCopy.prototype.copyFunc;
ModuleMove.prototype.delFunc = ModuleDelete.prototype.delFunc;

module.exports = ModuleMove;
