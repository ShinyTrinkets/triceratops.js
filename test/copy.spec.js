
const assert = require('chai').assert;
const fs = require('fs');
const crypto = require('crypto');
const async = require('async');

const ModuleCopy = require('../modules/ModuleCopy');
const ModuleDelete = require('../modules/ModuleDelete');
const ModuleMove = require('../modules/ModuleMove');


describe('ModuleCopy', function () {

  this.timeout(30 * 1000);

  const buf1 = crypto.randomBytes(1024);
  fs.writeFile('test/file1.xxx', buf1);
  const hash1 = crypto.createHash('sha256').update(buf1).digest('hex');

  const buf2 = crypto.randomBytes(1048);
  fs.writeFile('test/file2.xxx', buf2);
  const hash2 = crypto.createHash('sha256').update(buf2).digest('hex');


  it('should check prerequisites', done => {
    assert.isDefined(ModuleCopy);
    assert.isDefined(ModuleDelete);
    assert.isDefined(ModuleMove);
    assert.isDefined(ModuleCopy.prototype.copyFunc);
    assert.isDefined(ModuleDelete.prototype.delFunc);
    assert.isDefined(ModuleMove.prototype.moveFunc);
    done();
  });

  it('should copy a file', done => {
    const mod = new ModuleCopy({
      input: ['test/file1.xxx', 'test/file2.xxx'],
      output: 'modules'
    });
    mod.run(() => {
      const fc1 = fs.readFileSync('modules/file1.xxx');
      const fc2 = fs.readFileSync('modules/file2.xxx');
      const th1 = crypto.createHash('sha256').update(fc1).digest('hex');
      const th2 = crypto.createHash('sha256').update(fc2).digest('hex');
      assert.equal(buf1.length, fc1.length);
      assert.equal(buf2.length, fc2.length);
      assert.equal(hash1, th1);
      assert.equal(hash2, th2);
      done();
    });
  });

  it('should copy another file', done => {
    const mod = new ModuleCopy({
      input: ['modules/file1.xxx', 'modules/file2.xxx'],
      output: 'test',
      preStep: (i, o, cb) => {
        const n = o.replace('.xxx', '.rnd');
        console.log(`PRE:: hacking ${o} => ${n} ;`);
        cb(null, i, n);
      }
    });
    mod.run(() => {
      const fc1 = fs.readFileSync('test/file1.rnd');
      const fc2 = fs.readFileSync('test/file2.rnd');
      const th1 = crypto.createHash('sha256').update(fc1).digest('hex');
      const th2 = crypto.createHash('sha256').update(fc2).digest('hex');
      // Validate content length
      assert.equal(buf1.length, fc1.length);
      assert.equal(buf2.length, fc2.length);
      // Validate content
      assert.equal(hash1, th1);
      assert.equal(hash2, th2);
      // Cleanup the mess
      fs.unlinkSync('test/file1.rnd');
      fs.unlinkSync('test/file2.rnd');
      done();
    });
  });

  it('should exec post step', done => {
    const mod = new ModuleCopy({
      input: ['test/file1.xxx', 'test/file2.xxx'],
      output: 'modules',
      postStep: (i, o, cb) => {
        console.log(`POST:: delete "${i}" and "${o}" ;`);
        // Cleanup the mess
        fs.unlinkSync(i);
        fs.unlinkSync(o);
        cb(null);
      }
    });
    mod.run(() => {
      // The files should be deleted from Post Step
      async.parallel([
        cb => fs.access('test/file1.xxx', fs.constants.R_OK, err => cb(null, err ? true : false)),
        cb => fs.access('test/file2.xxx', fs.constants.R_OK, err => cb(null, err ? true : false)),
        cb => fs.access('modules/file1.xxx', fs.constants.R_OK, err => cb(null, err ? true : false)),
        cb => fs.access('modules/file2.xxx', fs.constants.R_OK, err => cb(null, err ? true : false))
      ], (err, results) => {
        assert.isNull(err);
        assert.equal(results.length, 4);
        done();
      })
    });
  });

});
