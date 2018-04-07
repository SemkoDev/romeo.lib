'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./base'),
    Base = _require.Base;

var _require2 = require('../config'),
    IOTA_DEPTH = _require2.IOTA_DEPTH,
    IOTA_MWM = _require2.IOTA_MWM;

var DEFAULT_OPTIONS = {
  index: 1,
  isCurrent: true,
  queue: null,
  seed: null,
  iota: null
};

var BasePage = function (_Base) {
  _inherits(BasePage, _Base);

  function BasePage(options) {
    _classCallCheck(this, BasePage);

    var opts = Object.assign({}, DEFAULT_OPTIONS, {
      logIdent: 'PAGES'
    }, options);

    var _this = _possibleConstructorReturn(this, (BasePage.__proto__ || Object.getPrototypeOf(BasePage)).call(this, opts));

    _this.opts = opts;
    _this.addresses = {};
    return _this;
  }

  _createClass(BasePage, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.sync(true);

              case 2:
                return _context.abrupt('return', _context.sent);

              case 3:
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
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.syncAddresses(priority, force);

              case 2:
                if (Object.keys(this.addresses).length) {
                  _context2.next = 7;
                  break;
                }

                _context2.next = 5;
                return this.getNewAddress();

              case 5:
                _context2.next = 7;
                return this.syncAddresses(priority, true);

              case 7:
                return _context2.abrupt('return', this);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function sync() {
        return _ref2.apply(this, arguments);
      }

      return sync;
    }()
  }, {
    key: 'asJson',
    value: function asJson() {
      var _opts = this.opts,
          index = _opts.index,
          isCurrent = _opts.isCurrent,
          seed = _opts.seed;

      return {
        index: index,
        isCurrent: isCurrent,
        seed: seed,
        addresses: this.addresses,
        jobs: this.getJobs()
      };
    }
  }, {
    key: 'applyAddresses',
    value: function applyAddresses(addresses) {
      var _this2 = this;

      var pastAddresses = Object.keys(this.addresses).filter(function (a) {
        return !addresses.includes(a);
      });
      var startIndex = pastAddresses.length;
      addresses.forEach(function (address, keyIndex) {
        if (!_this2.addresses[address]) {
          _this2.addresses[address] = {
            address: address,
            keyIndex: keyIndex + startIndex,
            security: 2,
            balance: 0,
            rawBalance: 0,
            spent: null,
            transactions: {}
          };
        }
      });
      this.onChange();
    }
  }, {
    key: 'getJobs',
    value: function getJobs() {
      var _this3 = this;

      return Object.values(this.opts.queue.jobs).filter(function (j) {
        return j.opts && j.opts.page === _this3.opts.index;
      });
    }
  }, {
    key: 'getNewAddress',
    value: function getNewAddress() {
      var _this4 = this;

      var total = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var _opts2 = this.opts,
          iota = _opts2.iota,
          seed = _opts2.seed,
          queue = _opts2.queue,
          index = _opts2.index,
          isCurrent = _opts2.isCurrent;


      return new Promise(function (resolve, reject) {
        var addressPromise = function addressPromise() {
          return new Promise(function (resolve, reject) {
            iota.api.getNewAddress(seed, {
              index: Object.keys(_this4.addresses).length,
              total: total
            }, function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(err, addresses) {
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        if (err) {
                          reject(err);
                        }
                        addresses = Array.isArray(addresses) ? addresses : [addresses];
                        _this4.applyAddresses(addresses);
                        _context3.next = 5;
                        return _this4.restoreAddresses(addresses, 'Attaching new addresses', 'Could not attach new addresses');

                      case 5:
                        _context3.next = 7;
                        return _this4.syncAddresses(100);

                      case 7:
                        _context3.t0 = callback;

                        if (!_context3.t0) {
                          _context3.next = 11;
                          break;
                        }

                        _context3.next = 11;
                        return callback(addresses);

                      case 11:
                        resolve(addresses);

                      case 12:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, _this4);
              }));

              return function (_x4, _x5) {
                return _ref3.apply(this, arguments);
              };
            }());
          });
        };

        var _queue$add = queue.add(addressPromise, isCurrent ? 15 : 5, {
          page: index,
          type: 'NEW_ADDRESS',
          description: 'Adding new addresses'
        }),
            job = _queue$add.job;

        job.on('finish', resolve);
        job.on('failed', function (err) {
          _this4.log('Could not add addresses', err);
          reject(err);
        });
        _this4.onChange();
      });
    }
  }, {
    key: 'syncAddresses',
    value: function syncAddresses(priority, cachedOnly) {
      var _this5 = this;

      var _opts3 = this.opts,
          iota = _opts3.iota,
          seed = _opts3.seed,
          queue = _opts3.queue,
          index = _opts3.index,
          isCurrent = _opts3.isCurrent;


      return new Promise(function (resolve, reject) {
        var cached = [];

        var addressPromise = function addressPromise() {
          return new Promise(function (resolve, reject) {
            iota.api.ext.getAddresses(seed, function (err, addresses) {
              if (!err) {
                cached = addresses;
                _this5.applyAddresses(addresses);
              }
            }, function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(err, addresses) {
                var missingAddresses;
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
                        missingAddresses = cached.filter(function (c) {
                          return !addresses.includes(c);
                        });

                        if (!missingAddresses.length) {
                          _context4.next = 6;
                          break;
                        }

                        _context4.next = 6;
                        return _this5.restoreAddresses(missingAddresses);

                      case 6:
                        cached.length < addresses.length && _this5.applyAddresses(addresses);
                        resolve(_this5);

                      case 8:
                      case 'end':
                        return _context4.stop();
                    }
                  }
                }, _callee4, _this5);
              }));

              return function (_x6, _x7) {
                return _ref4.apply(this, arguments);
              };
            }(), cachedOnly);
          });
        };

        var _queue$add2 = queue.add(addressPromise, priority || (isCurrent ? 15 : 5), {
          page: index,
          type: 'SYNC_ADDRESSES',
          description: (cachedOnly ? 'Loading' : 'Syncing') + ' addresses',
          cachedOnly: cachedOnly
        }),
            job = _queue$add2.job;

        job.on('finish', resolve);
        job.on('failed', function (err) {
          _this5.log('Could not sync page addresses', err);
          reject(err);
        });
        _this5.onChange();
      });
    }
  }, {
    key: 'sendTransfers',
    value: function sendTransfers(transfers, inputs, message, messageFail, priority) {
      var _this6 = this;

      var _opts4 = this.opts,
          iota = _opts4.iota,
          seed = _opts4.seed,
          queue = _opts4.queue,
          index = _opts4.index,
          isCurrent = _opts4.isCurrent;


      var sendPromise = function sendPromise() {
        return new Promise(function (resolve, reject) {
          iota.api.sendTransfer(seed, IOTA_DEPTH, IOTA_MWM, transfers, { inputs: inputs }, function (err, result) {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      return new Promise(function (resolve, reject) {
        var _queue$add3 = queue.add(sendPromise, priority || (isCurrent ? 20 : 10), {
          page: index,
          type: 'SEND_TRANSFER',
          description: message || 'Sending transfers'
        }),
            job = _queue$add3.job;

        job.on('finish', resolve);
        job.on('failed', function (err) {
          _this6.log(messageFail || 'Could not send transfer to the tangle', err);
          reject(err);
        });
        _this6.onChange();
      });
    }
  }, {
    key: 'restoreAddresses',
    value: function restoreAddresses(addresses, message, messageFail) {
      var _this7 = this;

      message = message || 'Restoring addresses';
      messageFail = messageFail || 'Could not restore the addresses';
      return Promise.all(addresses.map(function () {
        var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(address) {
          return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return _this7.sendTransfers([{ address: address, value: 0 }], null, message, messageFail);

                case 2:
                  return _context5.abrupt('return', _context5.sent);

                case 3:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, _this7);
        }));

        return function (_x8) {
          return _ref5.apply(this, arguments);
        };
      }())).then(function (res) {
        _this7.onChange();
        return res;
      });
    }
  }, {
    key: 'restoreMissingAddresses',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(total, message, messageFail) {
        var addresses;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.getNewAddress(total);

              case 2:
                addresses = _context6.sent;
                _context6.next = 5;
                return this.restoreAddresses(addresses, message, messageFail);

              case 5:
                return _context6.abrupt('return', _context6.sent);

              case 6:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function restoreMissingAddresses(_x9, _x10, _x11) {
        return _ref6.apply(this, arguments);
      }

      return restoreMissingAddresses;
    }()
  }]);

  return BasePage;
}(Base);

module.exports = {
  DEFAULT_OPTIONS: DEFAULT_OPTIONS,
  BasePage: BasePage
};