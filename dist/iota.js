'use strict';

var IOTA = require('iota.lib.js');

var _require = require('./db'),
    Database = _require.Database;

var _require2 = require('./config'),
    IOTA_API_ENDPOINT = _require2.IOTA_API_ENDPOINT;

function createAPI(_ref) {
  var path = _ref.path,
      password = _ref.password,
      provider = _ref.provider,
      database = _ref.database;

  var db = database || new Database({ path: path, password: password });
  var iota = new IOTA({ provider: provider || IOTA_API_ENDPOINT });
  var getTrytes = iota.api.getTrytes.bind(iota.api);

  iota.api.getTrytes = function (hashes, callback) {
    // First, get trytes from db
    db.getMany(hashes.map(function (h) {
      return 'tryte-' + h;
    })).then(function (result) {
      // See what we don't have
      var requestHashes = result.map(function (r, i) {
        return r ? null : hashes[i];
      }).filter(function (h) {
        return h;
      });

      if (requestHashes.length) {
        // Request from backend:
        getTrytes(requestHashes, function (err, trytes) {
          if (err) {
            callback(err, null);
          }
          // Save all returned hashes
          Promise.all(trytes.map(function (tryte, i) {
            return db.put('tryte-' + requestHashes[i], tryte);
          })).then(function () {
            // Mixin new returned trytes to previous results:
            callback(null, result.map(function (r) {
              return r || trytes.splice(0, 1)[0];
            }));
          });
        });
      } else {
        // If we have everything, return:
        callback(null, result);
      }
    });
  };

  function getBalances(addresses, threshold, onCache, onLive) {
    var cachedOnly = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    var callback = function callback(error, results) {
      if (error) {
        return onLive(error, null);
      }
      Promise.all(addresses.map(function (address, i) {
        return db.put('balance-' + address, results.balances[i]);
      })).then(function () {
        return onLive(null, results.balances.map(function (b) {
          return parseInt(b);
        }));
      });
    };

    db.getMany(addresses.map(function (address) {
      return 'balance-' + address;
    })).then(function (result) {
      var balances = result.map(function (r) {
        return parseInt(r || 0);
      });
      onCache(null, balances);
      if (cachedOnly) {
        onLive(null, balances);
      } else {
        iota.api.getBalances(addresses, threshold, callback);
      }
    }).catch(function (error) {
      onCache(error, null);
      !cachedOnly && iota.api.getBalances(addresses, threshold, callback);
    });
  }

  function getSpent(addresses, onCache, onLive) {
    var cachedOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var callback = function callback(error, results) {
      if (error) {
        return onLive(error, null);
      }
      Promise.all(addresses.map(function (address, i) {
        return db.put('spent-' + address, results[i]);
      })).then(function () {
        return onLive(null, results);
      });
    };

    db.getMany(addresses.map(function (address) {
      return 'spent-' + address;
    })).then(function (result) {
      onCache(null, result);
      if (cachedOnly) {
        onLive(null, result);
      } else {
        iota.api.wereAddressesSpentFrom(addresses, callback);
      }
    }).catch(function (error) {
      onCache(error, null);
      iota.api.wereAddressesSpentFrom(addresses, callback);
    });
  }

  function getAddresses(seed, onCache, onLive) {
    var cachedOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var callback = function callback(error, results) {
      if (error) {
        return onLive(error, null);
      }
      var addresses = results.slice(0, -1);
      db.put('addresses-' + seed, addresses).then(function () {
        return onLive(null, addresses);
      });
    };

    db.get('addresses-' + seed).then(function (result) {
      onCache(null, result ? result : []);
      if (cachedOnly) {
        onLive(null, result ? result : []);
      } else {
        iota.api.getNewAddress(seed, { returnAll: true }, callback);
      }
    }).catch(function (error) {
      onCache(error, null);
      iota.api.getNewAddress(seed, { returnAll: true }, callback);
    });
  }

  function getTransactions(address, onCache, onLive) {
    var cachedOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var callback = function callback(error, hashes, inclusions) {
      if (error) {
        return onLive(error, null);
      }
      db.put('transactions-' + address, hashes).then(function () {
        return db.put('inclusions-' + address, inclusions);
      }).then(function () {
        return onLive(null, { hashes: hashes, inclusions: inclusions });
      });
    };

    var findTransactions = function findTransactions() {
      if (cachedOnly) {
        return;
      }
      iota.api.findTransactions({ addresses: [address] }, function (error, hashes) {
        if (error) {
          return callback(error, null, null);
        }
        iota.api.getLatestInclusion(hashes, function (error, inclusions) {
          callback(error, hashes, inclusions);
        });
      });
    };

    var dbError = function dbError(error) {
      onCache(error, null, null);
      findTransactions();
    };

    db.get('transactions-' + address).then(function (hashes) {
      hashes = hashes ? hashes : [];
      return db.get('inclusions-' + address).then(function (inclusions) {
        var result = {
          hashes: hashes,
          inclusions: inclusions || hashes.map(function () {
            return false;
          })
        };
        onCache(null, result);
        if (cachedOnly) {
          onLive(null, result);
        } else {
          findTransactions();
        }
      }).catch(dbError);
    }).catch(dbError);
  }

  function getTransactionObjects(address, onCache, onLive) {
    var cachedOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var liveDone = false;

    var process = function process(live) {
      return function (error, result) {
        var cb = live ? onLive : onCache;

        if (error) {
          return cb(error, null);
        }
        if (!live && liveDone) {
          return;
        }

        var hashes = result.hashes,
            inclusions = result.inclusions;


        iota.api.getTrytes(hashes, function (error, trytes) {
          if (error) {
            return cb(error, null);
          }

          if (!live && liveDone) {
            return;
          }

          if (live) {
            liveDone = true;
          }

          cb(null, trytes.map(function (tryte, i) {
            return Object.assign({}, iota.utils.transactionObject(tryte), {
              persistence: inclusions[i]
            });
          }));
        });
      };
    };

    getTransactions(address, process(), process(true), cachedOnly);
  }

  iota.api.ext = {
    getBalances: getBalances,
    getAddresses: getAddresses,
    getTransactions: getTransactions,
    getTransactionObjects: getTransactionObjects,
    getSpent: getSpent,
    provider: IOTA_API_ENDPOINT
  };

  return iota;
}

module.exports = createAPI;