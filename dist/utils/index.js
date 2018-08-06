'use strict';

var crypto = require('crypto');
var validate = require('./validate');

/**
 * Creates a random 24-char-long hexadecimal identifier.
 * @returns {string}
 */
function createIdentifier() {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Returns number of seconds that passed starting from a given time.
 * @param time
 * @returns {number}
 */
function getSecondsPassed(time) {
  if (!time) {
    return 0;
  }
  return (new Date().getTime() - time.getTime()) / 1000;
}

module.exports = {
  validate: validate,
  createIdentifier: createIdentifier,
  getSecondsPassed: getSecondsPassed
};