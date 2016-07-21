
const lo = require('lodash');
const async = require('async');
const fs = require('fs');
const path = require('path');
const checkType = require('./utils').checkType;

/**
  @input: 1 or more files
  @output: the name of the destination folder
  */
class ModuleCopy {

  constructor(options) {
    if (options && options.input) {
      // List of files
      this.input = checkType('Array', options.input);
    }
    if (options && options.output) {
      // Destination folder
      this.output = checkType('String', options.output);
    }
    this.run = this.run.bind(this);
  }

  get size() {
    let total = 0;
    for (const fname of this.input) {
      total += fs.statSync(fname).size;
    }
    return total;
  }

  get progress() {
    let progr = 0;
    return progr;
  }

  run(options, final) {
    // If the "options" is the final callback function
    if (options && !final && lo.isFunction(options)) {
      final = options;
      options = null;
    }
    if (options && options.input) {
      this.input = checkType('Array', options.input);
    }
    if (options && options.output) {
      this.output = checkType('String', options.output);
    }
    console.log(`[ModuleCopy] :: input = ${JSON.stringify(this.input)}, ` +
      `output folder = ${JSON.stringify(this.output)};`)

    const pending = [];
    const ordered = [];

    for (const input of this.input) {
      const output = path.join(this.output, path.basename(input));
      const func = function(callback) {
        fs.createReadStream(input)
          .on('error', (err) => {
            console.error(`Cannot read file "${input}":: ${err.message}`);
            callback(err);
          })
          .on('end', () => {
            console.log(`Copied file "${input}" into "${output}".`);
            callback(null, output); // Files resulted in order of execution
          })
          .pipe(fs.createWriteStream(output))
          .on('error', (err) => {
            console.error(`Cannot write file "${input}":: ${err.message}`);
            callback(err);
          });
      };
      ordered.push(output); // File names for the next module
      pending.push(func); // The copy function for current file
    }

    async.parallel(pending, (err, _) => {
      if (err) {
        throw err;
      } else if (final && lo.isFunction(final)) {
        final(null, {input: ordered});
      }
    });
  }

};

module.exports = ModuleCopy;
