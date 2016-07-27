
const lo = require('lodash');
const async = require('async');
const fs = require('fs');
const path = require('path');
const checkType = require('./utils').checkType;

/**
  @input: 1 or more files
  @output: the name of the destination folder
  */
class BaseModule {

  constructor(options) {
    this.setup = this.setup.bind(this);
    this.run = this.run.bind(this);
    this.setup(options);
  }

  setup(options) {
    if (!options || !lo.isPlainObject(options)) {
      return;
    }
    if (options.input) {
      // List of input files
      this.input = checkType('Array', options.input);
      this.progr = this.input.length;
    } else {
      this.progr = 0;
    }
    if (options.output) {
      // Destination folder
      this.output = checkType('String', options.output);
    }
    if (lo.isFunction(options.preStart)) {
      // Before the start of the operation
      this.preStart = options.preStart;
    }
    if (lo.isFunction(options.postEnd)) {
      // After the end of the operation
      this.postEnd = options.postEnd;
    }
    if (lo.isFunction(options.preStep)) {
      // Before each file
      this.preStep = options.preStep;
    }
    if (lo.isFunction(options.postStep)) {
      // After each file
      this.postStep = options.postStep;
    }
    if (lo.isFunction(options.stepFunc)) {
      // The step function
      this.stepFunc = options.stepFunc;
    }
  }

  get size() {
    let total = 0;
    for (const fname of this.input) {
      total += fs.statSync(fname).size;
    }
    return total;
  }

  get progress() {
    return this.progr;
  }

  run(options, final) {
    // If the "options" is the final callback function
    if (options && !final && lo.isFunction(options)) {
      final = options;
      options = null;
    } else if (options) {
      this.setup(options);
    }

    const pending = [];
    const ordered = [];

    console.log(`\n[Module] :: input = ${JSON.stringify(this.input)}, ` +
      `output folder = ${JSON.stringify(this.output)};`);

    for (const infile of this.input) {
      let outfile; // Optional for some modules (eg: Delete)
      if (this.output) {
        outfile = path.join(this.output, path.basename(infile));
      }
      const func = callback => {
        async.waterfall([
          function preAction(cb) {
            // Before each hook
            if (this.preStep) {
              this.preStep(infile, outfile, (err, i, o) => {
                ordered.push(o); // File names for the next module
                cb(err, i, o);
              });
            } else {
              ordered.push(outfile); // File names for the next module
              cb(null, infile, outfile);
            }
          }.bind(this),
          function action(input, output, cb) {
            this.stepFunc(input, output, cb);
          }.bind(this),
          function postAction(input, output) {
            // After each hook
            if (this.postStep) {
              this.postStep(input, output, (err, _, o) => {
                callback(err, o);
              });
            } else {
              callback(null, output);
            }
          }.bind(this)
        ]);
      };
      pending.push(func); // The action function + hooks, for current file
    }

    async.waterfall([
      function beforeEverything(cb) {
        // Before everything hook
        if (this.preStart) {
          this.preStart(this.input, (err) => {
            cb(err);
          });
        } else {
          cb(null);
        }
      }.bind(this),
      function actions(cb) {
        // Run all pending steps
        async.parallel(pending, (err, result) => {
          cb(err, result);
        });
      }.bind(this),
      function afterEverything(result, cb) {
        // After everything hook
        if (this.postEnd) {
          this.postEnd(result, (err, o) => {
            cb(err, o);
          });
        } else {
          cb(null, result);
        }
      }.bind(this)
    ], err => {
      if (final && lo.isFunction(final)) {
        final(err, { input: ordered });
      }
    });
  }

}

module.exports = BaseModule;
