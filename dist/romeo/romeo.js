'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./base'),
    Base = _require.Base;

var crypto = require('../crypto');
var createQueue = require('../queue');
var createAPI = require('../iota');

var _require2 = require('../db'),
    Database = _require2.Database;

var _require3 = require('./pages'),
    Pages = _require3.Pages;

var DEFAULT_OPTIONS = {
  username: null,
  password: null,
  syncInterval: 60000,
  dbPath: 'romeo'
};

var Romeo = function (_Base) {
  _inherits(Romeo, _Base);

  function Romeo(options) {
    _classCallCheck(this, Romeo);

    var opts = Object.assign({}, DEFAULT_OPTIONS, {
      logIdent: 'ROMEO'
    }, options);

    var _this = _possibleConstructorReturn(this, (Romeo.__proto__ || Object.getPrototypeOf(Romeo)).call(this, opts));

    _this.ready = false;
    _this.isOnline = 1;
    _this.checkingOnline = false;
    _this.opts = opts;
    _this.keys = crypto.keys.getKeys(opts.username, opts.password);
    _this.db = new Database({ path: opts.dbPath, password: _this.keys.password });
    _this.iota = createAPI({ database: _this.db });
    _this.queue = createQueue();
    _this.pages = new Pages({
      keys: _this.keys,
      queue: _this.queue,
      iota: _this.iota,
      db: _this.db,
      onLog: function onLog(log) {
        return console.log('onLog', log);
      },
      onChange: _this.onChange
    });
    _this.updater = null;
    _this.onlineUpdater = null;
    _this.checkOnline = _this.checkOnline.bind(_this);
    _this.checkOnline();
    return _this;
  }

  _createClass(Romeo, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(restoreString) {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!restoreString) {
                  _context.next = 3;
                  break;
                }

                _context.next = 3;
                return this.db.restore(restoreString, true);

              case 3:
                _context.next = 5;
                return this.pages.init(false, 10000);

              case 5:
                this.updater = setInterval(function () {
                  return _this2.pages.syncCurrentPage();
                }, this.opts.syncInterval);
                this.onlineUpdater = setInterval(this.checkOnline, 30000);
                return _context.abrupt('return', this);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init(_x) {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'terminate',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var returnBackup = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.updater) {
                  clearInterval(this.updater);
                  this.updater = null;
                }
                if (this.onlineUpdater) {
                  clearInterval(this.onlineUpdater);
                  this.onlineUpdater = null;
                }
                this.queue.removeAll();

                if (!returnBackup) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt('return', this.backupDatabase());

              case 5:
                return _context2.abrupt('return', true);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function terminate() {
        return _ref2.apply(this, arguments);
      }

      return terminate;
    }()
  }, {
    key: 'asJson',
    value: function asJson() {
      var jobs = this.queue.jobs,
          keys = this.keys,
          pages = this.pages,
          isOnline = this.isOnline,
          checkingOnline = this.checkingOnline,
          ready = this.ready;

      return {
        keys: Object.assign({}, keys),
        jobs: Object.values(jobs).map(function (j) {
          return Object.assign({}, j);
        }),
        genericJobs: pages.getJobs().map(function (j) {
          return Object.assign({}, j);
        }),
        pages: pages.asJson(),
        isOnline: isOnline,
        checkingOnline: checkingOnline,
        provider: this.iota.api.ext.provider,
        ready: ready
      };
    }
  }, {
    key: 'checkOnline',
    value: function checkOnline() {
      var _this3 = this;

      var start = new Date();
      this.checkingOnline = true;
      this.iota.api.getNodeInfo(function (err) {
        _this3.checkingOnline = false;
        if (err) {
          _this3.isOnline = false;
          _this3.onChange();
          return;
        }
        _this3.isOnline = new Date() - start;
        _this3.onChange();
      });
    }
  }, {
    key: 'backupDatabase',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.db.backup(true);

              case 2:
                return _context3.abrupt('return', _context3.sent);

              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function backupDatabase() {
        return _ref3.apply(this, arguments);
      }

      return backupDatabase;
    }()
  }, {
    key: 'newPage',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var onCreate = arguments[1];

        var sourcePage, _opts$includeReuse, includeReuse, currentPage, newPage, address, inputs, value;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                sourcePage = opts.sourcePage, _opts$includeReuse = opts.includeReuse, includeReuse = _opts$includeReuse === undefined ? false : _opts$includeReuse;
                currentPage = sourcePage || this.pages.getCurrent();
                _context4.t0 = this.pages;
                _context4.next = 5;
                return this.pages.getNewPage();

              case 5:
                _context4.t1 = _context4.sent[0];
                newPage = _context4.t0.getByAddress.call(_context4.t0, _context4.t1).page;

                onCreate && onCreate(newPage);

                if (currentPage.isSynced()) {
                  _context4.next = 11;
                  break;
                }

                _context4.next = 11;
                return currentPage.sync();

              case 11:
                address = newPage.getCurrentAddress().address;
                inputs = currentPage.getInputs(includeReuse);
                value = inputs.reduce(function (t, i) {
                  return t + i.balance;
                }, 0);

                if (!(value > 0)) {
                  _context4.next = 19;
                  break;
                }

                _context4.next = 17;
                return currentPage.sendTransfers([{ address: address, value: value }], inputs, 'Moving funds to the new page', 'Failed moving funds!');

              case 17:
                currentPage.syncTransactions();
                newPage.syncTransactions();

              case 19:
                this.onChange();
                return _context4.abrupt('return', newPage);

              case 21:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function newPage() {
        return _ref4.apply(this, arguments);
      }

      return newPage;
    }()
  }, {
    key: 'onChange',
    value: function onChange() {
      if (!this.ready) {
        var current = this.pages.getCurrent();
        if (current && Object.keys(current.addresses).length) {
          this.ready = true;
        }
      }
      return _get(Romeo.prototype.__proto__ || Object.getPrototypeOf(Romeo.prototype), 'onChange', this).call(this);
    }
  }]);

  return Romeo;
}(Base);

module.exports = {
  DEFAULT_OPTIONS: DEFAULT_OPTIONS,
  Romeo: Romeo
};