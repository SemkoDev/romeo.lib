const { BasePage } = require('./base-page');
const { Page } = require('./page');
const crypto = require('../crypto');

const DEFAULT_OPTIONS = {
  index: -1,
  isCurrent: true,
  queue: null,
  keys: null,
  iota: null
};

class Pages extends BasePage {
  constructor(options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, {
      logIdent: `PAGE #${options.index || DEFAULT_OPTIONS.index}`
    }, options);
    const { keys: { ledger, password} } = opts;
    opts.seed = crypto.keys.getSeed(ledger, password);
    super(opts);
    this.pages = this.addresses;
    this.getNewPage = this.getNewAddress;
  }

  asJson () {
    return Object.values(this.pages).map((p) => {
      const { address, seed, keyIndex, page } = p;
      return { address, seed, keyIndex, page: page.asJson() }
    });
  }

  getAllJobs () {
    return Object.values(this.opts.queue.jobs)
      .filter(j => Number.isInteger(j.opts && j.opts.page))
  }

  applyAddresses (addresses) {
    const { keys: { password }, queue, iota } = this.opts;
    const startIndex = Object.keys(this.pages).length;

    addresses && addresses.length && Object.values(this.pages)
      .forEach(page => page.setCurrent(false));

    addresses.forEach((address, keyIndex) => {
      if (!this.pages[address]) {
        const index = keyIndex + startIndex;
        const seed = crypto.keys.getSeed(address, password);
        const page = new Page({
          queue, iota, index, seed,
          onChange: this.onChange,
          isCurrent: keyIndex === addresses.length - 1
        });

        this.pages[address] = {
          address,
          seed,
          keyIndex: index,
          page
        };

        page.init()
      }
    });
    this.onChange();
  }

  getCurrent () {
    const currentPage = Object.values(this.pages)
      .find(p => p.page.isCurrent());
    return currentPage ? currentPage.page : null
  }

  getByAddress (pageAddress) {
    return Object.values(this.pages)
      .find(p => p.address === pageAddress);
  }

  async syncCurrentPage (priority = 30) {
    const currentPage = this.getCurrent();
    return currentPage
      ? await currentPage.sync(true, priority)
      : null;
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  Pages
};
