
const lo = require('lodash');

function checkType(type, value) {
  if (lo[`is${type}`](value)) {
    return value;
  } else {
    throw new TypeError(`Value "${value}" must be ${type}!`);
  }
};

module.exports = { checkType };
