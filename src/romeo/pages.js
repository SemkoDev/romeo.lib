const { BasePage } = require('./base-page');
const { Page } = require('./page');
const crypto = require('../crypto');

const DEFAULT_OPTIONS = {
  index: -1,
  isCurrent: true,
  queue: null,
  keys: null,
  iota: null,
  db: null
};

class Pages extends BasePage {
  constructor(options) {
    const opts = Object.assign(
      {},
      DEFAULT_OPTIONS,
      {
        logIdent: `PAGE #${options.index || DEFAULT_OPTIONS.index}`
      },
      options
    );
    const { keys: { ledger, password } } = opts;
    opts.seed = crypto.keys.getSeed(ledger, password);
    super(opts);
    this.pages = this.addresses;
    this.getNewPage = this.getNewAddress;
  }

  asJson() {
    return Object.values(this.pages).map(p => {
      const { address, seed, keyIndex, page } = p;
      return { address, seed, keyIndex, page: page.asJson() };
    });
  }

  getAllJobs() {
    return Object.values(this.opts.queue.jobs).filter(j =>
      Number.isInteger(j.opts && j.opts.page)
    );
  }

  applyAddresses(addresses) {
    const { keys: { password }, queue, iota, db } = this.opts;
    const startIndex = Object.keys(this.pages)
      .filter(e => !addresses.includes(e)).length;
    let currentPage = null;
    const otherPages = [];

    addresses &&
      addresses.length &&
      Object.values(this.pages).forEach(page => page.page.setCurrent(false));

    addresses.forEach((address, keyIndex) => {
      if (!this.pages[address]) {
        const { onChange } = this;
        const index = keyIndex + startIndex;
        const isCurrent = keyIndex === addresses.length - 1;
        const seed = crypto.keys.getSeed(address, password);
        const page = new Page({
          db,
          queue,
          iota,
          index,
          seed,
          isCurrent,
          onChange
        });

        this.pages[address] = {
          address,
          seed,
          keyIndex: index,
          page
        };
        if (isCurrent) {
          currentPage = page;
        } else {
          otherPages.push(page);
        }
      }
    });
    Object.values(this.pages)
      .sort((a, b) => b.keyIndex - a.keyIndex)[0]
      .page.setCurrent(true);
    if (currentPage) {
      currentPage
        .init(true, 6000)
        .then(() => Promise.all(otherPages.map(p => p.init())));
    }
    this.onChange();
  }

  getCurrent() {
    const currentPage = Object.values(this.pages).find(p => p.page.isCurrent());
    return currentPage ? currentPage.page : null;
  }

  getByAddress(pageAddress) {
    return Object.values(this.pages).find(p => p.address === pageAddress);
  }

  getByIndex(index) {
    return Object.values(this.pages).find(p => p.keyIndex === index);
  }

  async syncPage(page, force = false, priority = 30) {
    return await page.sync(force, priority);
  }

  async syncCurrentPage(priority = 30) {
    const currentPage = this.getCurrent();
    return currentPage && !currentPage.isSynced()
      ? await this.syncPage(currentPage, true, priority)
      : null;
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  Pages
};
