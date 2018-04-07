'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./base-page'),
    BasePage = _require.BasePage;

var _require2 = require('../config'),
    IOTA_BALANCE_TRESHOLD = _require2.IOTA_BALANCE_TRESHOLD,
    PAGE_RESYNC_SECONDS = _require2.PAGE_RESYNC_SECONDS;

var _require3 = require('../utils'),
    getSecondsPassed = _require3.getSecondsPassed;

var DEFAULT_OPTIONS = {
  index: 1,
  isCurrent: true,
  queue: null,
  seed: null,
  iota: null,
  db: null
};

var Page = function (_BasePage) {
  _inherits(Page, _BasePage);

  function Page(options) {
    _classCallCheck(this, Page);

    var opts = Object.assign({}, DEFAULT_OPTIONS, {
      logIdent: 'PAGE #' + (options.index || DEFAULT_OPTIONS.index)
    }, options);

    var _this = _possibleConstructorReturn(this, (Page.__proto__ || Object.getPrototypeOf(Page)).call(this, opts));

    _this.lastSynced = null;
    _this.isSyncing = false;
    return _this;
  }

  _createClass(Page, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var priority = arguments[1];

        var _opts, db, seed, timestamp;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _opts = this.opts, db = _opts.db, seed = _opts.seed;

                if (!db) {
                  _context.next = 6;
                  break;
                }

                _context.next = 4;
                return db.get('lastsynced-' + seed);

              case 4:
                timestamp = _context.sent;

                this.lastSynced = timestamp ? new Date(timestamp) : null;

              case 6:
                _context.next = 8;
                return this.sync(force, priority);

              case 8:
                return _context.abrupt('return', _context.sent);

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: 'sync',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var priority = arguments[1];

        var _opts2, db, seed, isCurrent;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _opts2 = this.opts, db = _opts2.db, seed = _opts2.seed, isCurrent = _opts2.isCurrent;

                if (this.isSyncing) {
                  _context2.next = 38;
                  break;
                }

                _context2.prev = 2;

                this.isSyncing = true;
                _context2.next = 6;
                return this.syncAddresses(priority, !force);

              case 6:
                if (Object.keys(this.addresses).length) {
                  _context2.next = 14;
                  break;
                }

                _context2.next = 9;
                return this.syncAddresses(priority, false);

              case 9:
                if (Object.keys(this.addresses).length) {
                  _context2.next = 14;
                  break;
                }

                _context2.next = 12;
                return this.getNewAddress();

              case 12:
                _context2.next = 14;
                return this.syncAddresses(priority, false);

              case 14:
                if (Object.values(this.addresses).find(function (a) {
                  return !a.spent;
                })) {
                  _context2.next = 19;
                  break;
                }

                _context2.next = 17;
                return this.getNewAddress();

              case 17:
                _context2.next = 19;
                return this.syncAddresses(priority, false);

              case 19:
                _context2.next = 21;
                return this.syncTransactions(priority, !force && !isCurrent);

              case 21:
                _context2.next = 23;
                return this.syncBalances(priority, !force);

              case 23:
                _context2.next = 25;
                return this.syncSpent(priority, !force);

              case 25:
                this.isSyncing = false;
                this.lastSynced = isCurrent || force ? new Date() : this.lastSynced;

                if (!db) {
                  _context2.next = 31;
                  break;
                }

                _context2.next = 30;
                return db.put('lastsynced-' + seed, this.lastSynced);

              case 30:
                this.onChange();

              case 31:
                _context2.next = 38;
                break;

              case 33:
                _context2.prev = 33;
                _context2.t0 = _context2['catch'](2);

                this.isSyncing = false;
                this.onChange();
                throw _context2.t0;

              case 38:
                return _context2.abrupt('return', this);

              case 39:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[2, 33]]);
      }));

      function sync() {
        return _ref2.apply(this, arguments);
      }

      return sync;
    }()
  }, {
    key: 'setCurrent',
    value: function setCurrent(isCurrent) {
      this.opts.isCurrent = isCurrent;
    }
  }, {
    key: 'isCurrent',
    value: function isCurrent() {
      return this.opts.isCurrent;
    }
  }, {
    key: 'isSynced',
    value: function isSynced() {
      return this.lastSynced && getSecondsPassed(this.lastSynced) < PAGE_RESYNC_SECONDS;
    }
  }, {
    key: 'asJson',
    value: function asJson() {
      var lastSynced = this.lastSynced,
          isSyncing = this.isSyncing;

      return Object.assign(_get(Page.prototype.__proto__ || Object.getPrototypeOf(Page.prototype), 'asJson', this).call(this), {
        lastSynced: lastSynced,
        isSyncing: isSyncing,
        balance: this.getBalance(),
        hasSPA: this.hasSPA()
      });
    }
  }, {
    key: 'getBalance',
    value: function getBalance() {
      return Object.values(this.addresses).map(function (a) {
        return a.balance;
      }).reduce(function (t, i) {
        return t + i;
      }, 0);
    }
  }, {
    key: 'hasSPA',
    value: function hasSPA() {
      // Has spent positive addresses?
      return Object.values(this.addresses).find(function (a) {
        return a.rawBalance > 0 && a.balance > 0 && a.spent;
      });
    }
  }, {
    key: 'getCurrentAddress',
    value: function getCurrentAddress() {
      return Object.values(this.addresses).sort(function (a, b) {
        return b.keyIndex - a.keyIndex;
      }).find(function (a) {
        return !a.spent;
      });
    }
  }, {
    key: 'getInputs',
    value: function getInputs() {
      var includeSpent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      return Object.values(this.addresses).filter(function (a) {
        return a.balance > 0;
      }).filter(function (a) {
        return includeSpent || !a.spent;
      });
    }
  }, {
    key: 'isLoading',
    value: function isLoading() {
      var _opts3 = this.opts,
          queue = _opts3.queue,
          index = _opts3.index;

      return Object.values(queue.jobs).filter(function (j) {
        return !j.isFinished && j.ext.page === index;
      });
    }
  }, {
    key: 'getTransactions',
    value: function getTransactions() {
      return Object.values(this.addresses).map(function (a) {
        return a.transactions;
      }).reduce(function (t, i) {
        return t.concat(i);
      }, []);
    }
  }, {
    key: 'getNewAddress',
    value: function getNewAddress() {
      var _this2 = this;

      var total = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      return _get(Page.prototype.__proto__ || Object.getPrototypeOf(Page.prototype), 'getNewAddress', this).call(this, total, function (addresses) {
        return _this2.syncTransactions(40, false, addresses);
      });
    }
  }, {
    key: 'applyBalances',
    value: function applyBalances(addresses, balances) {
      var _this3 = this;

      addresses.forEach(function (address, i) {
        if (_this3.addresses[address]) {
          _this3.addresses[address].balance = balances[i];
        }
      });
      this.onChange();
    }
  }, {
    key: 'applySpent',
    value: function applySpent(addresses, states) {
      var _this4 = this;

      addresses.forEach(function (address, i) {
        if (_this4.addresses[address]) {
          _this4.addresses[address].spent = states[i];
        }
      });
      this.onChange();
    }
  }, {
    key: 'applyTransactions',
    value: function applyTransactions(address, transactions) {
      var obj = this.addresses[address];
      if (!obj) return;

      transactions.forEach(function (transaction) {
        obj.transactions[transaction.hash] = transaction;
      });
      obj.rawBalance = Object.values(obj.transactions).reduce(function (t, i) {
        return t + i.value;
      }, 0);
      this.onChange();
    }
  }, {
    key: 'syncBalances',
    value: function syncBalances(priority, cachedOnly) {
      var _this5 = this;

      var _opts4 = this.opts,
          iota = _opts4.iota,
          queue = _opts4.queue,
          index = _opts4.index,
          isCurrent = _opts4.isCurrent;

      var addresses = Object.keys(this.addresses);

      return new Promise(function (resolve, reject) {
        var balancePromise = function balancePromise() {
          return new Promise(function (resolve, reject) {
            iota.api.ext.getBalances(addresses, IOTA_BALANCE_TRESHOLD, function (err, balances) {
              if (!err) {
                _this5.applyBalances(addresses, balances);
              }
            }, function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(err, balances) {
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        if (!err) {
                          _context3.next = 2;
                          break;
                        }

                        return _context3.abrupt('return', reject(err));

                      case 2:
                        _this5.applyBalances(addresses, balances);
                        resolve(_this5);

                      case 4:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, _this5);
              }));

              return function (_x5, _x6) {
                return _ref3.apply(this, arguments);
              };
            }(), cachedOnly);
          });
        };

        var _queue$add = queue.add(balancePromise, priority || (isCurrent ? 24 : 14), {
          page: index,
          type: 'SYNC_BALANCES',
          description: (cachedOnly ? 'Loading' : 'Syncing') + ' balances',
          cachedOnly: cachedOnly
        }),
            job = _queue$add.job;

        job.on('finish', resolve);
        job.on('failed', function (err) {
          _this5.log('Could not sync page balances', err);
          reject(err);
        });
        _this5.onChange();
      });
    }
  }, {
    key: 'syncSpent',
    value: function syncSpent(priority, cachedOnly) {
      var _this6 = this;

      var _opts5 = this.opts,
          iota = _opts5.iota,
          queue = _opts5.queue,
          index = _opts5.index,
          isCurrent = _opts5.isCurrent;

      var addresses = Object.keys(this.addresses);

      return new Promise(function (resolve, reject) {
        var spentPromise = function spentPromise() {
          return new Promise(function (resolve, reject) {
            iota.api.ext.getSpent(addresses, function (err, states) {
              if (!err) {
                _this6.applySpent(addresses, states);
              }
            }, function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(err, states) {
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        if (!err) {
                          _context4.next = 2;
                          break;
                        }

                        return _context4.abrupt('return', reject(err));

                      case 2:
                        _this6.applySpent(addresses, states);
                        resolve(_this6);

                      case 4:
                      case 'end':
                        return _context4.stop();
                    }
                  }
                }, _callee4, _this6);
              }));

              return function (_x7, _x8) {
                return _ref4.apply(this, arguments);
              };
            }(), cachedOnly);
          });
        };

        var _queue$add2 = queue.add(spentPromise, priority || (isCurrent ? 23 : 13), {
          page: index,
          type: 'SYNC_SPENT',
          description: (cachedOnly ? 'Loading' : 'Syncing') + ' spent addresses',
          cachedOnly: cachedOnly
        }),
            job = _queue$add2.job;

        job.on('finish', resolve);
        job.on('failed', function (err) {
          _this6.log('Could not sync page states', err);
          reject(err);
        });
        _this6.onChange();
      });
    }
  }, {
    key: 'syncTransactions',
    value: function syncTransactions() {
      var priority = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      var _this7 = this;

      var cachedOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var addresses = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var _opts6 = this.opts,
          iota = _opts6.iota,
          queue = _opts6.queue,
          index = _opts6.index,
          isCurrent = _opts6.isCurrent;


      return new Promise(function (resolve, reject) {
        var transactionPromise = function transactionPromise() {
          return Promise.all((addresses || Object.keys(_this7.addresses)).map(function (address) {
            return new Promise(function (resolve, reject) {
              iota.api.ext.getTransactionObjects(address, function (err, transactions) {
                if (!err) {
                  _this7.applyTransactions(address, transactions);
                }
              }, function () {
                var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(err, transactions) {
                  return regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          if (!err) {
                            _context5.next = 2;
                            break;
                          }

                          return _context5.abrupt('return', reject(err));

                        case 2:
                          _this7.applyTransactions(address, transactions);
                          resolve(_this7);

                        case 4:
                        case 'end':
                          return _context5.stop();
                      }
                    }
                  }, _callee5, _this7);
                }));

                return function (_x12, _x13) {
                  return _ref5.apply(this, arguments);
                };
              }(), cachedOnly);
            });
          }));
        };

        var _queue$add3 = queue.add(transactionPromise, priority || (isCurrent ? 12 : 2), {
          page: index,
          type: 'SYNC_TRANSACTIONS',
          description: (cachedOnly ? 'Loading' : 'Syncing') + ' transactions',
          cachedOnly: cachedOnly
        }),
            job = _queue$add3.job;

        job.on('finish', function (result) {
          _this7.onChange();
          resolve(result);
        });
        job.on('failed', function (err) {
          _this7.log('Could not sync page transactions', err);
          reject(err);
        });
        _this7.onChange();
      });
    }
  }]);

  return Page;
}(BasePage);

module.exports = {
  Page: Page,
  DEFAULT_OPTIONS: DEFAULT_OPTIONS
};