const IOTA = require('iota.lib.js');
const { Database } = require('./db');
const { IOTA_API_ENDPOINT } = require('./config');

function createAPI({ path, password, provider, database }) {
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
          iota.api.getNewAddress(seed, { returnAll: true, total }, callback);
        }
      })
      .catch(error => {
        onCache(error, null);
        iota.api.getNewAddress(seed, { returnAll: true, total }, callback);
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

  iota.api.ext = {
    getBalances,
    getAddresses,
    getTransactions,
    getTransactionObjects,
    getSpent,
    provider: IOTA_API_ENDPOINT
  };

  return iota;
}

module.exports = createAPI;
