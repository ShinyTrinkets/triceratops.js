
const fs = require('fs');
const BaseModule = require('./BaseModule');

/**
  @input: 1 or more files
  No output!
  */
class ModuleDelete extends BaseModule {

  constructor(options) {
    super(options);
    this.delFunc = this.delFunc.bind(this);
    options.stepFunc = this.delFunc;
    this.setup(options);
  }

  delFunc(input, _, cb) {
    this.progr--;
    fs.unlink(input, (err) => {
      if (err) {
        console.error(`Cannot delete file "${input}":: ${err.message}`);
        cb(err);
      } else {
        if (!this.silent) {
          console.log(`Deleted file "${input}".`);
        }
        cb(null);
      }
    });
  }

}

module.exports = ModuleDelete;
