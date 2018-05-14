const crypto = require('../crypto');
const { BaseGuard } = require('./base');

/**
 * Simple username/password guard. Options to be provided:
 * - {string} username
 * - {string} password
 */
class SimpleGuard extends BaseGuard {
  constructor (options) {
    super(options);
    // generate keys using username and password
    this.keys = crypto.keys.getKeys(
      this.opts.username, this.opts.password
    );
    const { ledger, password } = this.keys;
    // generate ledger-seed
    this.seed = crypto.keys.getSeed(ledger, password);
    // cache of index-address values
    this.pageAddresses = {};
  }

  getPageSeed (pageIndex) {
    const cachedPageAddress = this.pageAddresses[pageIndex];
    return cachedPageAddress
      ? crypto.keys.getSeed(cachedPageAddress, this.keys.password)
      : null;
  }

  getChecksum () {
    return this.keys.checksum;
  }

  getSymmetricKey () {
    return this.keys.password;
  }

  ///////// Private methods should not be called directly! /////////

  async _getPages (index, total) {
    // getting ledger-page-addresses is the same as getting page addresses,
    // just using ledger seed instead of page seed:
    return await this._getGenericAddresses(this.seed, index, total);
  }

  async _getAddresses (index, total) {
    const seed = await this._getPageSeed(this.activePageIndex);
    return await this._getGenericAddresses(seed, index, total);
  }

  async _getSignedTransactions (transfers, inputs, remainderAddress) {
    // This is just a mapping to the default IOTA lib method.
    // We do not need to do any fancy stuff here, because we have the
    // seeds at hand. :)
    const seed = await this._getPageSeed(this.activePageIndex);
    const options = { inputs, address: remainderAddress.address };
    return await (() => new Promise((resolve, reject) => {
      this.iota.api.prepareTransfers(
        seed, transfers, options,
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      )
    }))();
  }

  ///////// Custom methods not part of the guard interface /////////

  /**
   * Returns page seed by index
   * @param index
   * @returns {Promise<string>}
   * @private
   */
  async _getPageSeed (index) {
    if (index < 0) return this.seed;
    return crypto.keys.getSeed(
      await this._getPageAddressByIndex(index),
      this.keys.password);
  }

  /**
   * Returns page-address by index
   * @param {int} index
   * @returns {Promise<string>}
   * @private
   */
  async _getPageAddressByIndex (index) {
    if (!this.pageAddresses[this.activePageIndex]) {
      this.pageAddresses[this.activePageIndex] = (
        await this._getPages(this.activePageIndex, 1))[0]
    }
    return this.pageAddresses[this.activePageIndex]
  }

  /**
   * Simple method to return addresses of given seed.
   * @param {string} seed
   * @param {int} index
   * @param {int} total
   * @returns {Promise<string[]>}
   * @private
   */
  _getGenericAddresses (seed, index, total) {
    return new Promise((resolve, reject) => {
      this.iota.api.getNewAddress(seed, {
        returnAll: true,
        index,
        total
      }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      })
    })
  }

}

module.exports = SimpleGuard;
