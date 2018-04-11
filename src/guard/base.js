const Queue = require('better-queue');
const MemoryStore = require('better-queue-memory');
const { createIdentifier } = require('../utils');
const createAPI = require('../iota');

const DEFAULT_OPTIONS = {
  concurrent: 1
};

class BaseGuard {
  constructor (options) {
    this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    // The guard queue will manage all the requests.
    // This allows setting a 1-lane concurrency, for example.
    this.queue = new Queue(
      (input, cb) => {
        input
          .promise()
          .then(result => cb(null, result))
          .catch(error => cb(error, null));
      },
      {
        store: new MemoryStore({}),
        id: 'id',
        priority: (job, cb) => cb(null, job.priority || 1),
        maxRetries: 5,
        retryDelay: 100,
        cancelIfRunning: true,
        concurrent: this.opts.concurrent
      }
    );
    this.queue.addJob = (promise, priority, opts) => {
      const id = createIdentifier();
      const job = this.queue.push({ id, promise, priority });
      job.opts = opts;
      job.id = id;
      job.priority = priority;
      return job;
    };
    this.activePageIndex = null;
    this.iota = null;
  }

  /**
   * Sets up the iota interface.
   * This might be useful if the guard wants to configure how
   * the IOTA API interface behaves, for example.
   * @param {Object} options
   * @returns {*}
   */
  setupIOTA (options) {
    this.iota = createAPI(Object.assign({}, options, {
      password: this.getSymmetricKey(),
      guard: this
    }));
    return this.iota;
  }

  /**
   * For guards that allow returning seeds.
   * Otherwise, do not override.
   * @param pageIndex
   * @returns {string|null}
   */
  getPageSeed (pageIndex) {
    return null;
  }

  /**
   * For guards that return a 3-char checksum.
   * Otherwise, do not override.
   * @param pageIndex
   * @returns {string|null}
   */
  getChecksum () {
    return null;
  }

  /**
   * Returns symmetric key for encoding/decoding arbitrary data.
   * Should be overridden!
   * @returns {String}
   */
  getSymmetricKey () {
    throw new Error('not implemented!');
  }

  /**
   * Resolves to array of addresses representing pages
   * @param {int} index
   * @param {int} total
   * @param {int} priority
   * @returns {Promise<String[]>}
   */
  async getPages (index, total, priority = 1) {
    const promiseFactory = () => new Promise (async (resolve) => {
      resolve(await this._getPages(index, total));
    });

    return new Promise((resolve, reject) => {
      const job = this.queue.addJob(
        promiseFactory,
        priority,
        { type: 'GET_PAGES' }
      );
      job.on('finish', resolve);
      job.on('failed', reject);
    });
  }

  /**
   * Resolves to array of addresses of a specific pages
   * @param {int} pageIndex
   * @param {int} index
   * @param {int} total
   * @param {int} priority
   * @returns {Promise<String[]>}
   */
  async getAddresses (pageIndex, index, total, priority = 1) {
    const promiseFactory = () => new Promise (async (resolve) => {
      this._setActivePage(pageIndex);
      resolve(await this._getAddresses(index, total));
    });

    return new Promise((resolve, reject) => {
      const job = this.queue.addJob(
        promiseFactory,
        priority,
        { page: pageIndex, type: 'GET_ADDRESSES' }
      );
      job.on('finish', resolve);
      job.on('failed', reject);
    });
  }

  /**
   * Returns a list of signed trytes.
   * @param {int} pageIndex
   * @param {Object[]} transfers
   * @param {Object[]} inputs
   * @param {Object} remainder
   * @param {int} priority
   * @returns {Promise<string[]>}
   */
  async getSignedTransactions (pageIndex, transfers, inputs, remainder, priority = 1) {
    const promiseFactory = () => new Promise (async (resolve) => {
      this._setActivePage(pageIndex);
      resolve(await this._getSignedTransactions(transfers, inputs, remainder));
    });

    return new Promise((resolve, reject) => {
      const job = this.queue.addJob(
        promiseFactory,
        priority,
        { page: pageIndex, type: 'GET_SIGNED_TRANSACTIONS' }
      );
      job.on('finish', resolve);
      job.on('failed', reject);
    });
  }

  ///////// Private methods should not be called directly! /////////

  /**
   * Sets active page to be used.
   * @param {int} pageIndex
   * @private
   */
  _setActivePage (pageIndex) {
    this.activePageIndex = pageIndex;
  }

  /**
   * Actual method to get page-addresses.
   * Should be overridden!
   * @param {int} index
   * @param {int} total
   * @returns {Promise<string[]>}
   * @private
   */
  async _getPages (index, total) {
    throw new Error('not implemented!');
  }

  /**
   * Actual method to get page-addresses.
   * Should be overridden!
   * @param {int} index
   * @param {int} total
   * @returns {Promise<string[]>}
   * @private
   */
  async _getAddresses (index, total) {
    throw new Error('not implemented!');
  }

  /**
   * Actual method to get page-addresses.
   * Should be overridden!
   * @param {Object[]} transfers
   * @param {Object[]} inputs
   * @param {Object} remainder
   * @returns {Promise<string[]>}
   * @private
   */
  async _getSignedTransactions (transfers, inputs, remainder) {
    // IMPORTANT: if the activePageIndex is < 0,
    // then it is a TX for the ledger seed!
    throw new Error('not implemented!');
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  BaseGuard
};
