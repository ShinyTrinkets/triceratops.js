
const fs = require('fs');
const BaseModule = require('./BaseModule');

/**
  @input: 1 or more files
  @output: the name of the destination folder
  */
class ModuleCopy extends BaseModule {

  constructor(options) {
    super(options);
    this.copyFunc = this.copyFunc.bind(this);
    options.step = this.copyFunc;
    this.setup(options);
  }

  get size() {
    let total = 0;
    for (const fname of this.input) {
      total += fs.statSync(fname).size;
    }
    return total;
  }

  copyFunc(input, output, cb) {
    this.progr--;
    fs.createReadStream(input)
      .on('error', err => {
        console.error(`Cannot read file "${input}":: ${err.message}`);
        cb(err);
      })
      .on('end', () => {
        if (!this.silent) {
          console.log(`Copied file "${input}" into "${output}".`);
        }
        cb(null, input, output); // Files resulted in order of execution
      })
      .pipe(fs.createWriteStream(output))
      .on('error', err => {
        console.error(`Cannot write file "${input}":: ${err.message}`);
        cb(err);
      });
  }

}

module.exports = ModuleCopy;
