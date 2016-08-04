
const lo = require('lodash');
const async = require('async');
const path = require('path');
const crypto = require('crypto');
const checkType = require('./utils').checkType;

function NotImplementedError(message) {
  this.name = 'NotImplementedError';
  this.message = message || 'Function not implemented';
  this.stack = (new Error()).stack;
}
NotImplementedError.prototype = Object.create(Error.prototype);
NotImplementedError.prototype.constructor = NotImplementedError;

/**
  @input: 1 or more files
  @output: the name of the destination folder
  */
class BaseModule {

  constructor(options) {
    this.moduleName = this.constructor.name;
    this.setup = this.setup.bind(this);
    this.validate = this.validate.bind(this);
    this.run = this.run.bind(this);
    this.setup(options);
  }

  setup(options) {
    if (!options || !lo.isPlainObject(options)) {
      return;
    }
    // Save the options for later
    // this.options = options;

    if (options.id) {
      // The ID of the module; Required!
      this.id = checkType('String', options.id);
    }
    if (!options.id) {
      // Or create ID
      this.id = `mod-${crypto.randomBytes(2).toString('hex')}`;
    }
    if (options.input) {
      // List of input files; Required!
      this.input = checkType('Array', options.input);
    }
    if (options.output) {
      // Destination folder; Required!
      this.output = checkType('String', options.output);
    }
    if (lo.isFunction(options.beforeAll)) {
      // Before the start of the operation
      this.beforeAll = options.beforeAll;
    }
    if (lo.isFunction(options.afterAll)) {
      // After the end of the operation
      this.afterAll = options.afterAll;
    }
    if (lo.isFunction(options.preStep)) {
      // Before each file
      this.preStep = options.preStep;
    }
    if (lo.isFunction(options.postStep)) {
      // After each file
      this.postStep = options.postStep;
    }
    if (lo.isFunction(options.step)) {
      // The step function
      this.step = options.step;
    }
  }

  validate() {
    if (!this.input) {
      throw new NotImplementedError('"input" variable is invalid');
    }

    if (!this.output) {
      throw new NotImplementedError('"output" variable is invalid');
    }

    if (!lo.isNumber(this.size)) {
      throw new NotImplementedError('"size" is invalid');
    }

    if (!lo.isFunction(this.step)) {
      throw new NotImplementedError('"step" function is not implemented');
    }
  }

  run(options, final) {
    // If the "options" is the final callback function
    if (options && !final && lo.isFunction(options)) {
      final = options;
      options = null;
    } else if (options) {
      this.setup(options);
    }

    this.validate();

    const pending = []; // All step functions
    const ordered = []; // All the file names

    console.log(`\n[${this.moduleName}] :: input = ${JSON.stringify(this.input)}, ` +
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
            this.step(input, output, cb);
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
        if (this.beforeAll) {
          this.beforeAll(this.input, (err) => {
            cb(err);
          });
        } else {
          cb(null);
        }
      }.bind(this),
      function actions(cb) {
        // Run all pending steps, Serial or Parallel
        async.series(pending, (err, result) => {
          cb(err, result);
        });
      }.bind(this),
      function afterEverything(result, cb) {
        // After everything hook
        if (this.afterAll) {
          this.afterAll(result, (err, o) => {
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
