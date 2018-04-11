const { Base } = require('./base');
const createQueue = require('../queue');
const { Database } = require('../db');
const { Pages } = require('./pages');

const DEFAULT_OPTIONS = {
  syncInterval: 60000,
  dbPath: 'romeo',
  guard: null
};

class Romeo extends Base {
  constructor(options) {
    const opts = Object.assign(
      {},
      DEFAULT_OPTIONS,
      {
        logIdent: 'ROMEO'
      },
      options
    );
    super(opts);
    if (!this.opts.guard) throw new Error('No guard provided!');
    this.guard = this.opts.guard;
    this.ready = false;
    this.isOnline = 1;
    this.checkingOnline = false;
    this.opts = opts;
    this.db = new Database({
      path: opts.dbPath,
      password: this.guard.getSymmetricKey() });
    this.iota = this.guard.setupIOTA({ database: this.db });
    this.queue = createQueue();
    this.pages = new Pages({
      guard: this.guard,
      queue: this.queue,
      iota: this.iota,
      db: this.db,
      onLog: log => console.log('onLog', log),
      onChange: this.onChange
    });
    this.updater = null;
    this.onlineUpdater = null;
    this.checkOnline = this.checkOnline.bind(this);
    this.checkOnline();
  }

  async init(restoreString) {
    if (restoreString) {
      await this.db.restore(restoreString, true);
    }
    await this.pages.init(false, 10000);
    this.updater = setInterval(
      () => this.pages.syncCurrentPage(),
      this.opts.syncInterval
    );
    this.onlineUpdater = setInterval(this.checkOnline, 30000);
    return this;
  }

  async terminate(returnBackup = false) {
    if (this.updater) {
      clearInterval(this.updater);
      this.updater = null;
    }
    if (this.onlineUpdater) {
      clearInterval(this.onlineUpdater);
      this.onlineUpdater = null;
    }
    this.queue.removeAll();
    if (returnBackup) {
      return this.backupDatabase();
    }
    return true;
  }

  asJson() {
    const {
      queue: { jobs },
      pages,
      isOnline,
      checkingOnline,
      ready
    } = this;
    return {
      jobs: Object.values(jobs).map(j => Object.assign({}, j)),
      genericJobs: pages.getJobs().map(j => Object.assign({}, j)),
      pages: pages.asJson(),
      isOnline,
      checkingOnline,
      provider: this.iota.api.ext.provider,
      ready
    };
  }

  checkOnline() {
    const start = new Date();
    this.checkingOnline = true;
    this.iota.api.getNodeInfo(err => {
      this.checkingOnline = false;
      if (err) {
        this.isOnline = false;
        this.onChange();
        return;
      }
      this.isOnline = new Date() - start;
      this.onChange();
    });
  }

  async backupDatabase() {
    return await this.db.backup(true);
  }

  async newPage(opts = {}, onCreate) {
    const { sourcePage, includeReuse = false } = opts;
    const currentPage = sourcePage || this.pages.getCurrent();

    const newPage = this.pages.getByAddress((await this.pages.getNewPage())[0])
      .page;
    onCreate && onCreate(newPage);

    if (!currentPage.isSynced()) {
      await currentPage.sync();
    }
    const address = newPage.getCurrentAddress().address;
    const inputs = currentPage.getInputs(includeReuse);
    const value = inputs.reduce((t, i) => t + i.balance, 0);
    if (value > 0) {
      await currentPage.sendTransfers(
        [{ address, value }],
        inputs,
        'Moving funds to the new page',
        'Failed moving funds!'
      );
      currentPage.syncTransactions();
      newPage.syncTransactions();
    }
    this.onChange();
    return newPage;
  }

  onChange() {
    if (!this.ready) {
      const current = this.pages.getCurrent();
      if (current && Object.keys(current.addresses).length) {
        this.ready = true;
      }
    }
    return super.onChange();
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  Romeo
};
