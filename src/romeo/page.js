const { BasePage } = require('./base-page');
const { IOTA_BALANCE_TRESHOLD, PAGE_RESYNC_SECONDS } = require('../config');
const { getSecondsPassed } = require('../utils');

const DEFAULT_OPTIONS = {
  index: 1,
  isCurrent: true,
  queue: null,
  seed: null,
  iota: null,
  db: null
};

class Page extends BasePage {
  constructor(options) {
    const opts = Object.assign(
      {},
      DEFAULT_OPTIONS,
      {
        logIdent: `PAGE #${options.index || DEFAULT_OPTIONS.index}`
      },
      options
    );
    super(opts);
    this.lastSynced = null;
    this.isSyncing = false;
  }

  async init(force = false, priority) {
    const { db, seed } = this.opts;
    if (db) {
      const timestamp = await db.get(`lastsynced-${seed}`);
      this.lastSynced = timestamp ? new Date(timestamp) : null;
    }
    return await this.sync(force, priority);
  }

  async sync(force = false, priority) {
    const { db, seed, isCurrent, index } = this.opts;
    if (!priority) {
      priority = index + 1;
    }
    if (!this.isSyncing) {
      try {
        this.isSyncing = true;
        await this.syncAddresses(priority, !force);
        // Auto-create a new unspent address
        if (!Object.values(this.addresses).find(a => !a.spent)) {
          await this.getNewAddress();
        }
        await this.syncTransactions(priority, !force);
        await this.syncBalances(priority, !force);
        await this.syncSpent(priority, !force);
        this.isSyncing = false;
        this.lastSynced = isCurrent || force ? new Date() : this.lastSynced;
        if (db) {
          await db.put(`lastsynced-${seed}`, this.lastSynced);
          this.onChange();
        }
      } catch (e) {
        this.isSyncing = false;
        this.onChange();
        throw e;
      }
    }
    return this;
  }

  setCurrent(isCurrent) {
    this.opts.isCurrent = isCurrent;
  }

  isCurrent() {
    return this.opts.isCurrent;
  }

  isSynced() {
    return (
      this.lastSynced && getSecondsPassed(this.lastSynced) < PAGE_RESYNC_SECONDS
    );
  }

  asJson() {
    const { lastSynced, isSyncing } = this;
    return Object.assign(super.asJson(), {
      lastSynced,
      isSyncing,
      balance: this.getBalance(),
      hasSPA: this.hasSPA()
    });
  }

  getBalance() {
    return Object.values(this.addresses)
      .map(a => a.balance)
      .reduce((t, i) => t + i, 0);
  }

  hasSPA() {
    // Has spent positive addresses?
    return Object.values(this.addresses).find(
      a => a.rawBalance > 0 && a.balance > 0 && a.spent
    );
  }

  getCurrentAddress() {
    return Object.values(this.addresses)
      .sort((a, b) => b.keyIndex - a.keyIndex)
      .find(a => !a.spent);
  }

  getInputs(includeSpent = false) {
    return Object.values(this.addresses)
      .filter(a => a.balance > 0)
      .filter(a => includeSpent || !a.spent);
  }

  isLoading() {
    const { queue, index } = this.opts;
    return Object.values(queue.jobs).filter(
      j => !j.isFinished && j.ext.page === index
    );
  }

  getTransactions() {
    return Object.values(this.addresses)
      .map(a => a.transactions)
      .reduce((t, i) => t.concat(i), []);
  }

  getNewAddress(total = 1) {
    return super.getNewAddress(total, addresses =>
      this.syncTransactions(40, false, addresses)
    );
  }

  applyBalances(addresses, balances) {
    addresses.forEach((address, i) => {
      if (this.addresses[address]) {
        this.addresses[address].balance = balances[i];
      }
    });
    this.onChange();
  }

  applySpent(addresses, states) {
    addresses.forEach((address, i) => {
      if (this.addresses[address]) {
        this.addresses[address].spent = states[i];
      }
    });
    this.onChange();
  }

  applyTransactions(address, transactions) {
    const obj = this.addresses[address];
    if (!obj) return;

    transactions.forEach(transaction => {
      obj.transactions[transaction.hash] = transaction;
    });
    obj.rawBalance = Object.values(obj.transactions).reduce(
      (t, i) => t + i.value,
      0
    );
    this.onChange();
  }

  syncBalances(priority, cachedOnly) {
    const { iota, queue, index, isCurrent } = this.opts;
    const addresses = Object.keys(this.addresses);

    return new Promise((resolve, reject) => {
      const balancePromise = () =>
        new Promise((resolve, reject) => {
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
            },
            cachedOnly
          );
        });
      const { job } = queue.add(
        balancePromise,
        priority || (isCurrent ? 24 : 14),
        {
          page: index,
          type: 'SYNC_BALANCES',
          description: `${cachedOnly ? 'Loading' : 'Syncing'} balances`,
          cachedOnly
        }
      );
      job.on('finish', resolve);
      job.on('failed', err => {
        this.log('Could not sync page balances', err);
        reject(err);
      });
      this.onChange();
    });
  }

  syncSpent(priority, cachedOnly) {
    const { iota, queue, index, isCurrent } = this.opts;
    const addresses = Object.keys(this.addresses);

    return new Promise((resolve, reject) => {
      const spentPromise = () =>
        new Promise((resolve, reject) => {
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
            },
            cachedOnly
          );
        });
      const { job } = queue.add(
        spentPromise,
        priority || (isCurrent ? 23 : 13),
        {
          page: index,
          type: 'SYNC_SPENT',
          description: `${cachedOnly ? 'Loading' : 'Syncing'} spent addresses`,
          cachedOnly
        }
      );
      job.on('finish', resolve);
      job.on('failed', err => {
        this.log('Could not sync page states', err);
        reject(err);
      });
      this.onChange();
    });
  }

  syncTransactions(priority = null, cachedOnly = false, addresses = null) {
    const { iota, queue, index, isCurrent } = this.opts;

    return new Promise((resolve, reject) => {
      const transactionPromise = () =>
        Promise.all(
          (addresses || Object.keys(this.addresses)).map(
            address =>
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
                );
              })
          )
        );

      const { job } = queue.add(
        transactionPromise,
        priority || (isCurrent ? 12 : 2),
        {
          page: index,
          type: 'SYNC_TRANSACTIONS',
          description: `${cachedOnly ? 'Loading' : 'Syncing'} transactions`,
          cachedOnly
        }
      );
      job.on('finish', result => {
        this.onChange();
        resolve(result);
      });
      job.on('failed', err => {
        this.log('Could not sync page transactions', err);
        reject(err);
      });
      this.onChange();
    });
  }
}

module.exports = {
  Page,
  DEFAULT_OPTIONS
};
