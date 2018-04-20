import Transport from '@ledgerhq/hw-transport-u2f';
import AppIota from 'hw-app-iota';
const Bundle = require('iota.lib.js/lib/crypto/bundle/bundle');
const {
  noChecksum,
  transactionTrytes
} = require('iota.lib.js/lib/utils/utils');
const { BaseGuard } = require('./base');

// use testnet path
const BIP44_PATH = [0x8000002c, 0x80000001, 0x80000000, 0x00000000, 0x00000000];
const DUMMY_SEED = '9'.repeat(81);
const EMPTY_TAG = '9'.repeat(27);

const DEFAULT_OPTIONS = {
  concurrent: 1,
  security: 2,
  debug: false
};

class LedgerGuard extends BaseGuard {
  constructor(hwapp, key, options) {
    super(options);
    this.opts = options;

    this.hwapp = hwapp;
    this.key = key;
  }

  static async build(options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    const transport = await Transport.create();
    if (opts.debug) {
      transport.setDebugMode(true);
    }
    const hwapp = new AppIota(transport);

    await LedgerGuard._setInternalSeed(hwapp, 2);
    const keyAddress = await hwapp.getPubKey(0);

    return new LedgerGuard(hwapp, keyAddress.substr(0, 32), opts);
  }

  getSymmetricKey() {
    return this.key;
  }

  ///////// Private methods should not be called directly! /////////

  async _setActivePage(pageIndex) {
    await this._setPageSeed(pageIndex);
  }

  async _getPages(index, total) {
    await this._setPageSeed(-1);
    return await this._getGenericAddresses(index, total);
  }

  async _getAddresses(index, total) {
    return await this._getGenericAddresses(index, total);
  }

  // TODO: remainder should be an object with address and keyIndex
  async _getSignedTransactions(transfers, inputs, remainderAddress) {
    // TODO: why is the remainderAddress an array?
    if (Array.isArray(remainderAddress)) {
      remainderAddress = remainderAddress[0];
    }
    inputs = inputs || [];

    // filter unnecessary inputs
    inputs = inputs.filter(input => input.balance > 0);

    if (this.opts.debug) {
      console.log(
        'prepareTransfers; #output=%i, #input=%i',
        transfers.length,
        inputs.length
      );
    }

    // the ledger is only needed, if there are proper inputs
    if (Array.isArray(inputs) && inputs.length) {
      if (inputs.length > 2 || transfers.length > 1) {
        throw new Error('Only one output and two inputs supported');
      }

      var remainder = {};
      if (remainderAddress) {
        const balance = inputs.reduce((a, i) => a + i.balance, 0);
        const payment = transfers.reduce((a, t) => a + t.value, 0);

        const maxInputIndex = inputs.reduce(
          (a, x) => Math.max(a, x.keyIndex),
          0
        );
        remainder = {
          address: noChecksum(remainderAddress),
          value: balance - payment,
          // TODO: this is just a dirty hack, before we get keyIndex
          keyIndex: maxInputIndex + 1
        };
      }

      return await this._getSignedLedgerTransactions(
        transfers,
        inputs,
        remainder
      );
    }

    // no inputs use the regular iota lib with a dummy seed
    const options = {
      inputs,
      address: remainder
    };
    return await (() =>
      new Promise((resolve, reject) => {
        this.iota.api.prepareTransfers(
          DUMMY_SEED,
          transfers,
          options,
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      }))();
  }

  async _getSignedLedgerTransactions(transfers, inputs, remainder) {
    // remove checksums
    transfers.forEach(t => (t.address = noChecksum(t.address)));
    inputs.forEach(i => (i.address = noChecksum(i.address)));

    // pad transfer tags
    transfers.forEach(t => (t.tag = t.tag ? t.tag.padEnd(27, '9') : EMPTY_TAG));
    // set correct security level
    inputs.forEach(i => (i.security = this.opts.security));

    // use the current time
    const timestamp = Math.floor(Date.now() / 1000);
    var bundle = new Bundle();

    transfers.forEach(t =>
      bundle.addEntry(1, t.address, t.value, t.tag, timestamp, -1)
    );
    inputs.forEach(i =>
      bundle.addEntry(
        i.security,
        i.address,
        -i.balance,
        EMPTY_TAG,
        timestamp,
        i.keyIndex
      )
    );
    if (remainder.value) {
      bundle.addEntry(
        1,
        remainder.address,
        remainder.value,
        EMPTY_TAG,
        timestamp,
        remainder.keyIndex
      );
    }
    bundle.addTrytes([]);
    bundle.finalize();

    // map internal addresses to their index
    var inputMapping = {};
    inputs.forEach(i => (inputMapping[i.address] = i.keyIndex));
    inputMapping[remainder.address] = remainder.keyIndex;

    // sign the bundle on the ledger
    bundle = await this.hwapp.signBundle({
      inputMapping,
      bundle,
      security: this.opts.security
    });

    // compute and return the corresponding trytes
    var bundleTrytes = [];
    bundle.bundle.forEach(tx => bundleTrytes.push(transactionTrytes(tx)));
    return bundleTrytes.reverse();
  }

  async _getGenericAddresses(index, total) {
    var addresses = [];
    for (var i = 0; i < total; i++) {
      const keyIndex = index + i;
      const address = await this.hwapp.getPubKey(keyIndex);
      if (this.opts.debug) {
        console.log('getGenericAddress; index=%i, key=%s', keyIndex, address);
      }
      addresses.push(address);
    }

    return addresses;
  }

  async _setPageSeed(pageIndex) {
    if (this.activePageIndex != pageIndex) {
      if (pageIndex < 0) {
        if (this.opts.debug) {
          console.log('setInternalSeed; index=%i', 1);
        }
        await LedgerGuard._setInternalSeed(this.hwapp, 1);
      } else {
        if (this.opts.debug) {
          console.log('setExternalSeed; index=%i', pageIndex);
        }
        await this.hwapp.setSeedInput(
          LedgerGuard._getBipPath(0, pageIndex),
          this.opts.security
        );
      }

      this.activePageIndex = pageIndex;
    }
  }

  static async _setInternalSeed(hwapp, index) {
    await hwapp.setSeedInput(LedgerGuard._getBipPath(1, index), 1);
  }

  static _getBipPath(change, index) {
    var path = BIP44_PATH.slice();
    path[3] = change;
    path[4] = index;
    return path;
  }
}

module.exports = LedgerGuard;
