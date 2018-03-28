const { Base } = require('./base');
const crypto = require('../crypto');
const createQueue = require('../queue');
const createAPI = require('../iota');
const { Database } = require('../db');
const { Pages } = require('./pages');

const DEFAULT_OPTIONS = {
  username: null,
  password: null,
  syncInterval: 30000,
  dbPath: 'romeo'
};

class Romeo extends Base {
  constructor(options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, {
      logIdent: 'ROMEO'
    }, options);
    super(opts);
    this.opts = opts;
    this.keys = crypto.keys.getKeys(opts.username, opts.password);
    this.db = new Database({ path: opts.dbPath, password: this.keys.password });
    this.iota = createAPI({ database: this.db });
    this.queue = createQueue();
    this.pages = new Pages({
      keys: this.keys,
      queue: this.queue,
      iota: this.iota,
      onLog: (log) => console.log('onLog', log),
      onChange: this.onChange
    });
    this.updater = null;
  }

  async init (restoreString) {
    if (restoreString) {
      await this.db.restore(data, true);
    }
    await this.pages.init();
    if (!Object.keys(this.pages.pages).length) {
      await this.pages.getNewPage();
      await this.pages.getCurrent().getNewAddress()
    }
    this.updater = setInterval(
      () => this.pages.syncCurrentPage(),
      this.opts.syncInterval
    );
    return this;
  }

  async terminate (returnBackup = false) {
    if (this.updater) {
      clearInterval(this.updater);
    }
    this.queue.removeAll();
    if (returnBackup) {
      return this.backupDatabase();
    }
    return true;
  }

  asJson () {
    const { queue : { jobs }, keys, pages } = this;
    return {
      keys,
      jobs: Object.values(jobs),
      genericJobs: pages.getJobs(),
      pages: pages.asJson()
    }
  }

  async backupDatabase () {
    return await this.db.backup(true);
  }

  async newPage (opts) {

    const { sourcePage, includeReuse = false } = opts;
    const currentPage = sourcePage || this.pages.getCurrent();

    const newPage = this.pages.getByAddress((await this.pages.getNewPage())[0]);

    if (!currentPage.isSynced()) {
      await currentPage.sync()
    }
    const address = (await newPage.getNewAddress())[0];
    const inputs = currentPage.getInputs(includeReuse);
    const value = inputs.reduce((t, i) => t + i.balance, 0);
    if (value > 0) {
      await currentPage.sendTransfers(
        [{ address, value }],
        inputs,
        'Moving funds from the current page to the new one',
        'Failed moving funds from the current page to the new one',
        );
      await newPage.syncTransactions();
    }
    return newPage;
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  Romeo
};
