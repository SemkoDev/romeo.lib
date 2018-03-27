const { BasePage } = require('./base-page');
const { IOTA_BALANCE_TRESHOLD, PAGE_RESYNC_SECONDS } = require('../config');
const { getSecondsPassed } = require('../utils');


const DEFAULT_OPTIONS = {
  index: 1,
  isCurrent: true,
  queue: null,
  seed: null,
  iota: null
};

class Page extends BasePage {
  constructor (options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, {
      logIdent: `PAGE #${options.index || DEFAULT_OPTIONS.index}`
    }, options);
    super(opts);
    this.lastSynced = null;
    this.isSyncing = false;
  }

  async init () {
    return await this.sync();
  }

  async sync (force = false, priority) {
    if (!this.isSyncing) {
      try {
        this.isSyncing = true;
        await this.syncAddresses(priority);
        await this.syncBalances(priority);
        await this.syncSpent(priority);
        await this.syncTransactions(!force && !this.opts.isCurrent, priority);
        this.isSyncing = false;
        this.lastSynced = new Date();
      } catch (e) {
        this.isSyncing = false;
        throw e;
      }
    }
    return this;
  }

  setCurrent (isCurrent) {
    this.opts.isCurrent = isCurrent;
  }

  isCurrent () {
    return this.opts.isCurrent;
  }

  isSynced () {
    return this.lastSynced && getSecondsPassed(this.lastSynced) > PAGE_RESYNC_SECONDS;
  }

  getBalance () {
    return Object.values(this.addresses)
      .map(a => a.balance)
      .reduce((t, i) => t + i, 0);
  }

  getInputs (includeSpent = false) {
    return Object
      .values(this.addresses)
      .filter(a => a.balance > 0)
      .filter(a => includeSpent || !a.spent)
  }

  isLoading () {
    const { queue, index } = this.opts;
    return Object.values(queue.jobs)
      .filter(j => !j.isFinished && j.ext.page === index)
  }

  getTransactions () {
    return Object
      .values(this.addresses)
      .map(a => a.transactions)
      .reduce((t, i) => t.concat(i), [])
  }

  applyBalances (addresses, balances) {
    addresses.forEach((address, i) => {
      if (this.addresses[address]) {
        this.addresses[address].balance = balances[i];
      }
    });
    this.onChange();
  }

  applySpent (addresses, states) {
    addresses.forEach((address, i) => {
      if (this.addresses[address]) {
        this.addresses[address].spent = states[i];
      }
    });
    this.onChange();
  }

  applyTransactions (address, transactions) {
    const obj = this.addresses[address];
    if (!obj) return;

    transactions.forEach((transaction) => {
      obj.transactions[transaction.hash] = transaction;
    });
    this.onChange();
  }

  syncBalances (priority) {
    const { iota, queue, index, isCurrent } = this.opts;
    const addresses = Object.keys(this.addresses);

    return new Promise((resolve, reject) => {
      const balancePromise = new Promise((resolve, reject) => {
        iota.api.ext.getBalances(
          addresses,
          IOTA_BALANCE_TRESHOLD,
          (err, balances) => {
            if (!err) {
              this.applyBalances(addresses, balances);
            }
          },
          async (err, balances) => {
            if (err) {
              return reject(err);
            }
            this.applyBalances(addresses, balances);
            resolve(this);
          }
        )
      });
      const { job } = queue.add(
        balancePromise,
        priority || (isCurrent ? 24 : 14),
        {
          page: index,
          type: 'SYNC_BALANCES',
          description: `Syncing balances for ${isCurrent ? 'current ' : ''}page #${index}`
        });
      job.on('finish', resolve);
      job.on('failed', (err) => {
        this.log('Could not sync page balances', err);
        reject(err);
      });
    });
  }

  syncSpent (priority) {
    const { iota, queue, index, isCurrent } = this.opts;
    const addresses = Object.keys(this.addresses);

    return new Promise((resolve, reject) => {
      const spentPromise = new Promise((resolve, reject) => {
        iota.api.ext.getSpent(
          addresses,
          (err, states) => {
            if (!err) {
              this.applySpent(addresses, states);
            }
          },
          async (err, states) => {
            if (err) {
              return reject(err);
            }
            this.applySpent(addresses, states);
            resolve(this);
          }
        )
      });
      const { job } = queue.add(
        spentPromise,
        priority || (isCurrent ? 23 : 13),
        {
          page: index,
          type: 'SYNC_SPENT',
          description: `Syncing states`
        });
      job.on('finish', resolve);
      job.on('failed', (err) => {
        this.log('Could not sync page states', err);
        reject(err);
      });
    });
  }

  syncTransactions (cachedOnly = false, priority = null) {
    const { iota, queue, index, isCurrent } = this.opts;

    return new Promise((resolve, reject) => {
      const transactionPromise = Promise.all(
        Object.keys(this.addresses).map((address) => (
          new Promise((resolve, reject) => {
            iota.api.ext.getTransactionObjects(
              address,
              (err, transactions) => {
                if (!err) {
                  this.applyTransactions(address, transactions);
                }
              },
              async (err, transactions) => {
                if (err) {
                  return reject(err);
                }
                this.applyTransactions(address, transactions);
                resolve(this);
              },
              cachedOnly
            )
          })
        ))
      );

      const { job } = queue.add(
        transactionPromise,
        priority || (isCurrent ? 12 : 2),
        {
          page: index,
          type: 'SYNC_TRANSACTIONS',
          description: `Syncing transactions`
        });
      job.on('finish', resolve);
      job.on('failed', (err) => {
        this.log('Could not sync page transactions', err);
        reject(err);
      });
    })
  }

}

module.exports = {
  Page,
  DEFAULT_OPTIONS
};
