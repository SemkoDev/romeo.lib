'use strict';

var shajs = require('sha.js');

var _require = require('iota.lib.js/lib/utils/asciiToTrytes'),
    toTrytes = _require.toTrytes;

var Kerl = require('iota.lib.js/lib/crypto/kerl/kerl');
var Converter = require('iota.lib.js/lib/crypto/converter/converter');

function getSeed(key, password) {
  if (key.length % 243 !== 0) {
    key = '' + key + '9'.repeat(243 - key.length % 243);
  }
  if (password.length % 243 !== 0) {
    password = '' + password + '9'.repeat(243 - password.length % 243);
  }
  var hash = [];
  var kerl = new Kerl();
  kerl.initialize();
  kerl.absorb(Converter.trits(key), 0);
  kerl.absorb(Converter.trits(password), 0);
  kerl.squeeze(hash, 0);
  return Converter.trytes(hash);
}

function getKeys(username, password) {
  var raw = shajs('sha512').update(username + ':' + password).digest('hex');
  var base = toTrytes(raw);
  return {
    service: base.substr(0, 81),
    ledger: base.substr(81, 81),
    password: base.substr(162, 32),
    passwordExt: base.substr(162, 81),
    extra: base.substr(243, 10),
    checksum: base.substr(253)
  };
}

module.exports = {
  getKeys: getKeys,
  getSeed: getSeed
};