
const assert = require('chai').assert;
const lo = require('lodash');
const fs = require('fs');
const crypto = require('crypto');
const async = require('async');

const ModuleCopy = require('../modules/ModuleCopy');
const { generateRandomFiles } = require('./common');


describe('ModuleCopy', function () {

  this.timeout(30 * 1000);

  const files = generateRandomFiles(3);
  let cycle1 = [];
  let cycle2 = [];

  it('should check prerequisites', done => {
    assert.isDefined(ModuleCopy);
    assert.isDefined(ModuleCopy.prototype.copyFunc);
    done();
  });

  it('should copy a file', done => {
    const mod = new ModuleCopy({
      input: lo.map(files, 'name'),
      output: 'modules'
    });
    mod.run((err, result) => {
      cycle1 = result.input; // Save for next cycle
      let index = 0;
      for (const fname of result.input) {
        const data = fs.readFileSync(fname);
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        // Validate content length
        assert.equal(data.length, files[index].buff.length);
        // Validate contents
        assert.equal(hash, files[index].hash);
        console.log(`${fname} is OK ;`);
        index++;
      }
      done();
    });
  });

  it('should copy another file', done => {
    const mod = new ModuleCopy({
      input: cycle1,
      output: 'test',
      preStep: (i, o, cb) => {
        const n = o.replace('.xxx', '.rnd');
        console.log(`PRE:: hacking ${o} => ${n} ;`);
        cb(null, i, n);
      }
    });
    mod.run((err, result) => {
      cycle2 = result.input; // Save for next cycle
      let index = 0;
      for (const fname of result.input) {
        const data = fs.readFileSync(fname);
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        // Validate content length
        assert.equal(data.length, files[index].buff.length);
        // Validate contents
        assert.equal(hash, files[index].hash);
        // Cleanup the mess
        fs.unlinkSync(fname);
        console.log(`${fname} is OK ;`);
        index++;
      }
      done();
    });
  });

  it('should exec post step', done => {
    const mod = new ModuleCopy({
      input: lo.map(files, 'name'),
      output: 'modules',
      postStep: (i, o, cb) => {
        console.log(`POST:: delete "${i}" and "${o}" ;`);
        // Cleanup the mess
        fs.unlinkSync(i);
        fs.unlinkSync(o);
        cb(null);
      }
    });
    mod.run((err, result) => {
      const clean = [];
      for (let f of files) {
        clean.push(cb =>
          fs.access(f.name, fs.constants.R_OK, err => cb(null, err ? true : false))
        );
      }
      for (let f of cycle1) {
        clean.push(cb =>
          fs.access(f, fs.constants.R_OK, err => cb(null, err ? true : false))
        );
      }
      for (let f of cycle2) {
        clean.push(cb =>
          fs.access(f, fs.constants.R_OK, err => cb(null, err ? true : false))
        );
      }
      // The files should be deleted from Post Step
      async.parallel(clean, (err, results) => {
        assert.isNull(err);
        assert.equal(results.length, files.length * 3);
        assert.deepEqual(results, lo.times(results.length, lo.stubTrue));
        done();
      });
    });
  });

});
