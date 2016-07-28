
const fs = require('fs');
const crypto = require('crypto');

function generateRandomFiles(nr) {
  const result = [];
  for (let i = 1; i < nr; i++) {
    const name = `test/file${i}.xxx`;
    const buff = crypto.randomBytes(1024);
    const hash = crypto.createHash('sha256').update(buff).digest('hex');
    fs.writeFileSync(name, buff);
    result.push({ name, buff, hash });
  }
  return result;
}

module.exports = { generateRandomFiles };
