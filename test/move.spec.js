
const assert = require('chai').assert;
const lo = require('lodash');
const fs = require('fs');
const crypto = require('crypto');
const async = require('async');

const ModuleMove = require('../modules/ModuleMove');
const { generateRandomFiles } = require('./common');


describe('ModuleMove', function () {

  this.timeout(30 * 1000);

  const files = generateRandomFiles(3);
  let cycle1 = [];
  let cycle2 = [];

  it('should check prerequisites', done => {
    assert.isDefined(ModuleMove);
    assert.isDefined(ModuleMove.prototype.copyFunc);
    done();
  });

  it('should move a file', done => {
    const mod = new ModuleMove({
      input: lo.map(files, 'name'),
      output: 'modules'
    });
    mod.run((err, result) => {
      assert.isNull(err);
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

  it('should move another file', done => {
    const mod = new ModuleMove({
      input: cycle1,
      output: 'test',
      preStep: (i, o, cb) => {
        const n = o.replace('.xxx', '.rnd');
        console.log(`PRE:: hacking ${o} => ${n} ;`);
        cb(null, i, n);
      }
    });
    mod.run((err, result) => {
      assert.isNull(err);
      cycle2 = result.input; // Save for next cycle
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

  it('should exec post step', done => {
    const mod = new ModuleMove({
      input: cycle2,
      output: 'modules',
      afterAll: (files, cb) => {
        console.log(`AFTER:: delete all: "${files}" ;`);
        // Cleanup the mess
        for (const fname of files) {
          fs.unlinkSync(fname);
        }
        cb(null);
      }
    });
    mod.run((err, result) => {
      assert.isNull(err);
      assert.equal(result.input.length, files.length);
      done();
    });
  });

});
