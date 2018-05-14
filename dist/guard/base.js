'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Queue = require('better-queue');
var MemoryStore = require('better-queue-memory');

var _require = require('../utils'),
    createIdentifier = _require.createIdentifier;

var createAPI = require('../iota');

var DEFAULT_OPTIONS = {
  concurrent: 1
};

var BaseGuard = function () {
  function BaseGuard(options) {
    var _this = this;

    _classCallCheck(this, BaseGuard);

    this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    // The guard queue will manage all the requests.
    // This allows setting a 1-lane concurrency, for example.
    this.queue = new Queue(function (input, cb) {
      input.promise().then(function (result) {
        return cb(null, result);
      }).catch(function (error) {
        return cb(error, null);
      });
    }, {
      store: new MemoryStore({}),
      id: 'id',
      priority: function priority(job, cb) {
        return cb(null, job.priority || 1);
      },
      maxRetries: 5,
      retryDelay: 100,
      cancelIfRunning: true,
      concurrent: this.opts.concurrent
    });
    this.queue.addJob = function (promise, priority, opts) {
      var id = createIdentifier();
      var job = _this.queue.push({ id: id, promise: promise, priority: priority });
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


  _createClass(BaseGuard, [{
    key: 'setupIOTA',
    value: function setupIOTA(options) {
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

  }, {
    key: 'getPageSeed',
    value: function getPageSeed(pageIndex) {
      return null;
    }

    /**
     * Return max number of outputs, apart of inputs, that the guard supports for transfers.
     * 0 = unlimited
     * @returns {number}
     */

  }, {
    key: 'getMaxOutputs',
    value: function getMaxOutputs() {
      return 6;
    }

    /**
     * Return max number of outputs, apart of inputs, that the guard supports for transfers.
     * 0 = unlimited
     * @returns {number}
     */

  }, {
    key: 'getMaxInputs',
    value: function getMaxInputs() {
      return 6;
    }

    /**
     * For guards that return a 3-char checksum.
     * Otherwise, do not override.
     * @param pageIndex
     * @returns {string|null}
     */

  }, {
    key: 'getChecksum',
    value: function getChecksum() {
      return null;
    }

    /**
     * Returns symmetric key for encoding/decoding arbitrary data.
     * Should be overridden!
     * @returns {String}
     */

  }, {
    key: 'getSymmetricKey',
    value: function getSymmetricKey() {
      throw new Error('not implemented!');
    }

    /**
     * Resolves to array of addresses representing pages
     * @param {int} index
     * @param {int} total
     * @param {int} priority
     * @returns {Promise<String[]>}
     */

  }, {
    key: 'getPages',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(index, total) {
        var _this2 = this;

        var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
        var promiseFactory;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                promiseFactory = function promiseFactory() {
                  return new Promise(function () {
                    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(resolve) {
                      return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _context.t0 = resolve;
                              _context.next = 3;
                              return _this2._getPages(index, total);

                            case 3:
                              _context.t1 = _context.sent;
                              (0, _context.t0)(_context.t1);

                            case 5:
                            case 'end':
                              return _context.stop();
                          }
                        }
                      }, _callee, _this2);
                    }));

                    return function (_x4) {
                      return _ref2.apply(this, arguments);
                    };
                  }());
                };

                return _context2.abrupt('return', new Promise(function (resolve, reject) {
                  var job = _this2.queue.addJob(promiseFactory, priority, { type: 'GET_PAGES' });
                  job.on('finish', resolve);
                  job.on('failed', reject);
                }));

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getPages(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return getPages;
    }()

    /**
     * Resolves to array of addresses of a specific pages
     * @param {int} pageIndex
     * @param {int} index
     * @param {int} total
     * @param {int} priority
     * @returns {Promise<String[]>}
     */

  }, {
    key: 'getAddresses',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(pageIndex, index, total) {
        var _this3 = this;

        var priority = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
        var promiseFactory;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                promiseFactory = function promiseFactory() {
                  return new Promise(function () {
                    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(resolve, reject) {
                      var res;
                      return regeneratorRuntime.wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              _context3.next = 2;
                              return _this3._setActivePage(pageIndex);

                            case 2:
                              _context3.prev = 2;
                              _context3.next = 5;
                              return _this3._getAddresses(index, total);

                            case 5:
                              res = _context3.sent;

                              resolve(res);
                              _context3.next = 12;
                              break;

                            case 9:
                              _context3.prev = 9;
                              _context3.t0 = _context3['catch'](2);

                              reject(_context3.t0);

                            case 12:
                            case 'end':
                              return _context3.stop();
                          }
                        }
                      }, _callee3, _this3, [[2, 9]]);
                    }));

                    return function (_x9, _x10) {
                      return _ref4.apply(this, arguments);
                    };
                  }());
                };

                return _context4.abrupt('return', new Promise(function (resolve, reject) {
                  var job = _this3.queue.addJob(promiseFactory, priority, { page: pageIndex, type: 'GET_ADDRESSES' });
                  job.on('finish', resolve);
                  job.on('failed', reject);
                }));

              case 2:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getAddresses(_x6, _x7, _x8) {
        return _ref3.apply(this, arguments);
      }

      return getAddresses;
    }()

    /**
     * Returns a list of signed trytes.
     * @param {int} pageIndex
     * @param {Object[]} transfers
     * @param {Object[]} inputs
     * @param {Object} remainder
     * @param {int} priority
     * @returns {Promise<string[]>}
     */

  }, {
    key: 'getSignedTransactions',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(pageIndex, transfers, inputs, remainder) {
        var _this4 = this;

        var priority = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
        var promiseFactory;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                promiseFactory = function promiseFactory() {
                  return new Promise(function () {
                    var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(resolve, reject) {
                      var signedTransactions;
                      return regeneratorRuntime.wrap(function _callee5$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              _this4._setActivePage(pageIndex);
                              _context5.prev = 1;
                              _context5.next = 4;
                              return _this4._getSignedTransactions(transfers, inputs, remainder);

                            case 4:
                              signedTransactions = _context5.sent;

                              resolve(signedTransactions);
                              _context5.next = 11;
                              break;

                            case 8:
                              _context5.prev = 8;
                              _context5.t0 = _context5['catch'](1);

                              reject(_context5.t0);

                            case 11:
                            case 'end':
                              return _context5.stop();
                          }
                        }
                      }, _callee5, _this4, [[1, 8]]);
                    }));

                    return function (_x16, _x17) {
                      return _ref6.apply(this, arguments);
                    };
                  }());
                };

                return _context6.abrupt('return', new Promise(function (resolve, reject) {
                  var job = _this4.queue.addJob(promiseFactory, priority, { page: pageIndex, type: 'GET_SIGNED_TRANSACTIONS' });
                  job.on('finish', resolve);
                  job.on('failed', reject);
                }));

              case 2:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function getSignedTransactions(_x12, _x13, _x14, _x15) {
        return _ref5.apply(this, arguments);
      }

      return getSignedTransactions;
    }()

    ///////// Private methods should not be called directly! /////////

    /**
     * Sets active page to be used.
     * @param {int} pageIndex
     * @private
     */

  }, {
    key: '_setActivePage',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(pageIndex) {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                this.activePageIndex = pageIndex;

              case 1:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function _setActivePage(_x18) {
        return _ref7.apply(this, arguments);
      }

      return _setActivePage;
    }()

    /**
     * Actual method to get page-addresses.
     * Should be overridden!
     * @param {int} index
     * @param {int} total
     * @returns {Promise<string[]>}
     * @private
     */

  }, {
    key: '_getPages',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(index, total) {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                throw new Error('not implemented!');

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function _getPages(_x19, _x20) {
        return _ref8.apply(this, arguments);
      }

      return _getPages;
    }()

    /**
     * Actual method to get page-addresses.
     * Should be overridden!
     * @param {int} index
     * @param {int} total
     * @returns {Promise<string[]>}
     * @private
     */

  }, {
    key: '_getAddresses',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(index, total) {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                throw new Error('not implemented!');

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function _getAddresses(_x21, _x22) {
        return _ref9.apply(this, arguments);
      }

      return _getAddresses;
    }()

    /**
     * Actual method to get page-addresses.
     * Should be overridden!
     * @param {Object[]} transfers
     * @param {Object[]} inputs
     * @param {Object} remainder: { address, keyIndex }
     * @returns {Promise<string[]>}
     * @private
     */

  }, {
    key: '_getSignedTransactions',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(transfers, inputs, remainder) {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                throw new Error('not implemented!');

              case 1:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function _getSignedTransactions(_x23, _x24, _x25) {
        return _ref10.apply(this, arguments);
      }

      return _getSignedTransactions;
    }()
  }]);

  return BaseGuard;
}();

module.exports = {
  DEFAULT_OPTIONS: DEFAULT_OPTIONS,
  BaseGuard: BaseGuard
};