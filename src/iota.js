const IOTA = require('iota.lib.js');
const async = require('async');
const { Database } = require('./db');
const { IOTA_API_ENDPOINT } = require('./config');

function createAPI({ path, password, provider, database, guard }) {
  const db = database || new Database({ path, password });
  const iota = new IOTA({ provider: provider || IOTA_API_ENDPOINT });
  const getTrytes = iota.api.getTrytes.bind(iota.api);

  iota.api.getTrytes = function(hashes, callback) {
    // First, get trytes from db
    db.getMany(hashes.map(h => `tryte-${h}`)).then(result => {
      // See what we don't have
      const requestHashes = result
        .map((r, i) => (r ? null : hashes[i]))
        .filter(h => h);

      if (requestHashes.length) {
        // Request from backend:
        getTrytes(requestHashes, (err, trytes) => {
          if (err) {
            callback(err, null);
          }
          // Save all returned hashes
          Promise.all(
            trytes.map((tryte, i) => db.put(`tryte-${requestHashes[i]}`, tryte))
          ).then(() => {
            // Mixin new returned trytes to previous results:
            callback(null, result.map(r => r || trytes.splice(0, 1)[0]));
          });
        });
      } else {
        // If we have everything, return:
        callback(null, result);
      }
    });
  };

  function getBalances(
    addresses,
    threshold,
    onCache,
    onLive,
    cachedOnly = false
  ) {
    const callback = (error, results) => {
      if (error) {
        return onLive(error, null);
      }
      Promise.all(
        addresses.map((address, i) =>
          db.put(`balance-${address}`, results.balances[i])
        )
      ).then(() => onLive(null, results.balances.map(b => parseInt(b))));
    };

    db
      .getMany(addresses.map(address => `balance-${address}`))
      .then(result => {
        const balances = result.map(r => parseInt(r || 0));
        onCache(null, balances);
        if (cachedOnly) {
          onLive(null, balances);
        } else {
          iota.api.getBalances(addresses, threshold, callback);
        }
      })
      .catch(error => {
        onCache(error, null);
        !cachedOnly && iota.api.getBalances(addresses, threshold, callback);
      });
  }

  function getSpent(addresses, onCache, onLive, cachedOnly = false) {
    const callback = (error, results) => {
      if (error) {
        return onLive(error, null);
      }
      Promise.all(
        addresses.map((address, i) => db.put(`spent-${address}`, results[i]))
      ).then(() => onLive(null, results));
    };

    db
      .getMany(addresses.map(address => `spent-${address}`))
      .then(result => {
        onCache(null, result);
        if (cachedOnly) {
          onLive(null, result);
        } else {
          iota.api.wereAddressesSpentFrom(addresses, callback);
        }
      })
      .catch(error => {
        onCache(error, null);
        iota.api.wereAddressesSpentFrom(addresses, callback);
      });
  }

  function getAddresses(seed, onCache, onLive, cachedOnly = false, total) {
    const callback = (error, results) => {
      if (error) {
        return onLive(error, null);
      }
      const addresses = results.slice(0, -1);
      db
        .put(`addresses-${seed}`, addresses)
        .then(() => onLive(null, addresses));
    };

    db
      .get(`addresses-${seed}`)
      .then(result => {
        onCache(null, result ? result : []);
        if (cachedOnly && result && result.length) {
          onLive(null, result ? result : []);
        } else {
          _getNewAddress(iota.api, guard, seed, 0, total, callback);
        }
      })
      .catch(error => {
        onCache(error, null);
        _getNewAddress(iota.api, guard, seed, 0, total, callback);
      });
  }

  function getTransactions(address, onCache, onLive, cachedOnly = false) {
    const callback = (error, hashes, inclusions) => {
      if (error) {
        return onLive(error, null);
      }
      db
        .put(`transactions-${address}`, hashes)
        .then(() => db.put(`inclusions-${address}`, inclusions))
        .then(() => onLive(null, { hashes, inclusions }));
    };

    const findTransactions = (force = false) => {
      if (cachedOnly && !force) {
        return;
      }
      iota.api.findTransactions({ addresses: [address] }, (error, hashes) => {
        if (error) {
          return callback(error, null, null);
        }
        iota.api.getLatestInclusion(hashes, (error, inclusions) => {
          callback(error, hashes, inclusions);
        });
      });
    };

    const dbError = error => {
      onCache(error, null, null);
      findTransactions();
    };

    db
      .get(`transactions-${address}`)
      .then(hashes => {
        hashes = hashes ? hashes : [];
        return db
          .get(`inclusions-${address}`)
          .then(inclusions => {
            const result = {
              hashes,
              inclusions: inclusions || hashes.map(() => false)
            };
            onCache(null, result);
            if (cachedOnly && inclusions && inclusions.length) {
              onLive(null, result);
            } else {
              findTransactions(true);
            }
          })
          .catch(dbError);
      })
      .catch(dbError);
  }

  // TODO: find a way to get Transactions for multiple addresses at once.
  function getTransactionObjects(address, onCache, onLive, cachedOnly = false) {
    let liveDone = false;

    const process = live => (error, result) => {
      const cb = live ? onLive : onCache;

      if (error) {
        return cb(error, null);
      }
      if (!live && liveDone) {
        return;
      }

      const { hashes, inclusions } = result;

      iota.api.getTrytes(hashes, (error, trytes) => {
        if (error) {
          return cb(error, null);
        }

        if (!live && liveDone) {
          return;
        }

        if (live) {
          liveDone = true;
        }

        cb(
          null,
          trytes.map((tryte, i) =>
            Object.assign({}, iota.utils.transactionObject(tryte), {
              persistence: inclusions[i]
            })
          )
        );
      });
    };

    getTransactions(address, process(), process(true), cachedOnly);
  }

  function getNewAddress (pageIndex, index, total, callback) {
    if (!guard) throw new Error('guard has not been set up!');
    _getNewAddress(iota.api, guard, pageIndex, index, total, callback, false);
  }

  function sendTransfer (pageIndex, depth, minWeightMagnitude, transfers, options, callback) {
    if (!guard) throw new Error('guard has not been set up!');
    _sendTransfer(iota.api, guard, pageIndex, depth, minWeightMagnitude, transfers, options, callback);
  }

  iota.api.ext = {
    sendTransfer,
    getNewAddress,
    getBalances,
    getAddresses,
    getTransactions,
    getTransactionObjects,
    getSpent,
    provider: IOTA_API_ENDPOINT
  };

  return iota;
}

function _getNewAddress (api, guard, seedOrPageIndex, index, total, callback, returnAll = true) {
  if (!guard) {
    api.getNewAddress(seedOrPageIndex, { returnAll, total }, callback);
  } else {
    const getter = seedOrPageIndex < 0
      ? guard.getPages.bind(guard)
      : (i, t) => guard.getAddresses(seedOrPageIndex, i, t);
    (async () => {
      const allAddresses = [];

      // Case 1: total
      //
      // If total number of addresses to generate is supplied, simply generate
      // and return the list of all addresses
      if (total) {
        return callback(null, await getter(index, total));
      }
      //  Case 2: no total provided
      //
      //  Continue calling wasAddressSpenFrom & findTransactions to see if address was already created
      //  if null, return list of addresses
      //
      else {
        async.doWhilst(function(callback) {
          // Iteratee function
          getter(index, 1).then(addresses => {
            const newAddress = addresses[0];

            if (returnAll) {
              allAddresses.push(newAddress)
            }

            // Increase the index
            index += 1;

            api.wereAddressesSpentFrom(newAddress, function (err, res) {
              if (err) {
                return callback(err)
              }

              // Validity check
              if (res[0]) {
                callback(null, newAddress, true, index - 1)
              } else { // Check for txs if address isn't spent
                api.findTransactions({'addresses': [newAddress]}, function (err, transactions) {
                  if (err) {
                    return callback(err)
                  }
                  callback(err, newAddress, transactions.length > 0, index - 1)
                })
              }
            })
          });

        }, function (address, isUsed) {
          return isUsed
        }, function(err, address, isUsed, index) {
          if (err) {
            return callback(err);
          } else {
            return callback(null, returnAll ? allAddresses : address, index);
          }
        })
      }
    })();
  }
}

function _sendTransfer (api, guard, seedOrPageIndex, depth, minWeightMagnitude, transfers, options, callback) {
  if (!guard) {
    return api.sendTransfer(seedOrPageIndex, depth, minWeightMagnitude, transfers, options, callback);
  }

  (async () => {
    let index = options.addressIndex;
    try {
      const { inputs } = options;
      const totalValue = transfers.reduce((t, i) => t + i.value, 0);
      if (totalValue > 0 && !options.inputs)
        return callback(new Error('No inputs for guard send provided!'));
      const remainder = totalValue > 0
        ? (options.address ||
          await (() => new Promise(resolve => {
            _getNewAddress(
              api, guard, seedOrPageIndex, 0, 1,
              (error, address, addressIndex) => {
                if (error) throw error;
                index = addressIndex
                resolve(address);
              },
              false);
          }))())
        : null;

      const trytes = await guard.getSignedTransactions(
        seedOrPageIndex, transfers, inputs, { address: remainder, keyIndex: index });

      api.sendTrytes(trytes, depth, minWeightMagnitude, options, callback);
    }
    catch (err) {
      callback(err);
    }
  })();
}

module.exports = createAPI;
