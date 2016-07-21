
const lo = require('lodash');
const async = require('async');
const fs = require('fs');
const path = require('path');
const checkType = require('./utils').checkType;

/**
  @input: 1 or more files
  No output!
  */
class ModuleDelete {

  constructor(options) {
    if (options && options.input) {
      // List of files
      this.input = checkType('Array', options.input);
    }
    this.run = this.run.bind(this);
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
    console.log(`[ModuleDelete] :: input = ${JSON.stringify(this.input)};`);

    const pending = [];

    for (const path of this.input) {
      const func = function(callback) {
        fs.unlink(path, (err) => {
          if (err) {
            console.error(`Cannot delete file "${path}":: ${err.message}`);
            callback(err);
          } else {
            console.log(`Deleted file "${path}".`);
            callback(null, true);
          }
        });
      };
      pending.push(func); // The del function for current file
    }

    async.parallel(pending, (err, _) => {
      if (err) {
        throw err;
      } else if (final && lo.isFunction(final)) {
        final(null, {});
      }
    });
  }

};

module.exports = ModuleDelete;
