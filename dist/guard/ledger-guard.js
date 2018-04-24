'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hwTransportU2f = require('@ledgerhq/hw-transport-u2f');

var _hwTransportU2f2 = _interopRequireDefault(_hwTransportU2f);

var _hwAppIota = require('hw-app-iota');

var _hwAppIota2 = _interopRequireDefault(_hwAppIota);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Bundle = require('iota.lib.js/lib/crypto/bundle/bundle');

var _require = require('iota.lib.js/lib/utils/utils'),
    noChecksum = _require.noChecksum,
    transactionTrytes = _require.transactionTrytes;

var _require2 = require('./base'),
    BaseGuard = _require2.BaseGuard;

// use testnet path


var BIP44_PATH = [0x8000002c, 0x80000001, 0x80000000, 0x00000000, 0x00000000];
var DUMMY_SEED = '9'.repeat(81);
var EMPTY_TAG = '9'.repeat(27);

var DEFAULT_OPTIONS = {
  concurrent: 1,
  security: 2,
  debug: false
};

var LedgerGuard = function (_BaseGuard) {
  _inherits(LedgerGuard, _BaseGuard);

  function LedgerGuard(hwapp, key, options) {
    _classCallCheck(this, LedgerGuard);

    var _this = _possibleConstructorReturn(this, (LedgerGuard.__proto__ || Object.getPrototypeOf(LedgerGuard)).call(this, options));

    _this.opts = options;

    _this.hwapp = hwapp;
    _this.key = key;
    return _this;
  }

  _createClass(LedgerGuard, [{
    key: 'getMaxOutputs',
    value: function getMaxOutputs() {
      return 1;
    }
  }, {
    key: 'getMaxInputs',
    value: function getMaxInputs() {
      return 2;
    }
  }, {
    key: 'getSymmetricKey',
    value: function getSymmetricKey() {
      return this.key;
    }

    ///////// Private methods should not be called directly! /////////

  }, {
    key: '_setActivePage',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(pageIndex) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._setPageSeed(pageIndex);

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _setActivePage(_x) {
        return _ref.apply(this, arguments);
      }

      return _setActivePage;
    }()
  }, {
    key: '_getPages',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(index, total) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._setPageSeed(-1);

              case 2:
                _context2.next = 4;
                return this._getGenericAddresses(index, total);

              case 4:
                return _context2.abrupt('return', _context2.sent);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _getPages(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return _getPages;
    }()
  }, {
    key: '_getAddresses',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(index, total) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._getGenericAddresses(index, total);

              case 2:
                return _context3.abrupt('return', _context3.sent);

              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _getAddresses(_x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return _getAddresses;
    }()
  }, {
    key: '_getSignedTransactions',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(transfers, inputs, remainder) {
        var _this2 = this;

        var balance, payment, options;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                // filter unnecessary inputs
                inputs = inputs || [];
                inputs = inputs.filter(function (input) {
                  return input.balance > 0;
                });

                if (this.opts.debug) {
                  console.log('prepareTransfers; #output=%i, #input=%i', transfers.length, inputs.length);
                }

                // the ledger is only needed, if there are proper inputs

                if (!(Array.isArray(inputs) && inputs.length)) {
                  _context4.next = 8;
                  break;
                }

                if (remainder) {
                  balance = inputs.reduce(function (a, i) {
                    return a + i.balance;
                  }, 0);
                  payment = transfers.reduce(function (a, t) {
                    return a + t.value;
                  }, 0);


                  remainder = {
                    address: noChecksum(remainder.address),
                    value: balance - payment,
                    keyIndex: remainder.keyIndex
                  };
                }

                _context4.next = 7;
                return this._getSignedLedgerTransactions(transfers, inputs, remainder);

              case 7:
                return _context4.abrupt('return', _context4.sent);

              case 8:

                // no inputs use the regular iota lib with a dummy seed
                options = {
                  inputs: inputs,
                  address: remainder
                };
                _context4.next = 11;
                return function () {
                  return new Promise(function (resolve, reject) {
                    _this2.iota.api.prepareTransfers(DUMMY_SEED, transfers, options, function (err, result) {
                      if (err) return reject(err);
                      resolve(result);
                    });
                  });
                }();

              case 11:
                return _context4.abrupt('return', _context4.sent);

              case 12:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _getSignedTransactions(_x6, _x7, _x8) {
        return _ref4.apply(this, arguments);
      }

      return _getSignedTransactions;
    }()
  }, {
    key: '_getSignedLedgerTransactions',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(transfers, inputs, remainder) {
        var _this3 = this;

        var timestamp, bundle, inputMapping, bundleTrytes;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                // remove checksums
                transfers.forEach(function (t) {
                  return t.address = noChecksum(t.address);
                });
                inputs.forEach(function (i) {
                  return i.address = noChecksum(i.address);
                });

                // pad transfer tags
                transfers.forEach(function (t) {
                  return t.tag = t.tag ? t.tag.padEnd(27, '9') : EMPTY_TAG;
                });
                // set correct security level
                inputs.forEach(function (i) {
                  return i.security = _this3.opts.security;
                });

                // use the current time
                timestamp = Math.floor(Date.now() / 1000);
                bundle = new Bundle();


                transfers.forEach(function (t) {
                  return bundle.addEntry(1, t.address, t.value, t.tag, timestamp, -1);
                });
                inputs.forEach(function (i) {
                  return bundle.addEntry(i.security, i.address, -i.balance, EMPTY_TAG, timestamp, i.keyIndex);
                });
                if (remainder) {
                  bundle.addEntry(1, remainder.address, remainder.value, EMPTY_TAG, timestamp, remainder.keyIndex);
                }
                bundle.addTrytes([]);
                bundle.finalize();

                // map internal addresses to their index
                inputMapping = {};

                inputs.forEach(function (i) {
                  return inputMapping[i.address] = i.keyIndex;
                });
                inputMapping[remainder.address] = remainder.keyIndex;

                // sign the bundle on the ledger
                _context5.next = 16;
                return this.hwapp.signBundle({
                  inputMapping: inputMapping,
                  bundle: bundle,
                  security: this.opts.security
                });

              case 16:
                bundle = _context5.sent;


                // compute and return the corresponding trytes
                bundleTrytes = [];

                bundle.bundle.forEach(function (tx) {
                  return bundleTrytes.push(transactionTrytes(tx));
                });
                return _context5.abrupt('return', bundleTrytes.reverse());

              case 20:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _getSignedLedgerTransactions(_x9, _x10, _x11) {
        return _ref5.apply(this, arguments);
      }

      return _getSignedLedgerTransactions;
    }()
  }, {
    key: '_getGenericAddresses',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(index, total) {
        var addresses, i, keyIndex, address;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                addresses = [];
                i = 0;

              case 2:
                if (!(i < total)) {
                  _context6.next = 12;
                  break;
                }

                keyIndex = index + i;
                _context6.next = 6;
                return this.hwapp.getPubKey(keyIndex);

              case 6:
                address = _context6.sent;

                if (this.opts.debug) {
                  console.log('getGenericAddress; index=%i, key=%s', keyIndex, address);
                }
                addresses.push(address);

              case 9:
                i++;
                _context6.next = 2;
                break;

              case 12:
                return _context6.abrupt('return', addresses);

              case 13:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function _getGenericAddresses(_x12, _x13) {
        return _ref6.apply(this, arguments);
      }

      return _getGenericAddresses;
    }()
  }, {
    key: '_setPageSeed',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(pageIndex) {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (!(this.activePageIndex != pageIndex)) {
                  _context7.next = 11;
                  break;
                }

                if (!(pageIndex < 0)) {
                  _context7.next = 7;
                  break;
                }

                if (this.opts.debug) {
                  console.log('setInternalSeed; index=%i', 1);
                }
                _context7.next = 5;
                return LedgerGuard._setInternalSeed(this.hwapp, 1);

              case 5:
                _context7.next = 10;
                break;

              case 7:
                if (this.opts.debug) {
                  console.log('setExternalSeed; index=%i', pageIndex);
                }
                _context7.next = 10;
                return this.hwapp.setSeedInput(LedgerGuard._getBipPath(0, pageIndex), this.opts.security);

              case 10:

                this.activePageIndex = pageIndex;

              case 11:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function _setPageSeed(_x14) {
        return _ref7.apply(this, arguments);
      }

      return _setPageSeed;
    }()
  }], [{
    key: 'build',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(options) {
        var opts, transport, hwapp, keyAddress;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                opts = Object.assign({}, DEFAULT_OPTIONS, options);
                _context8.next = 3;
                return _hwTransportU2f2.default.create();

              case 3:
                transport = _context8.sent;

                if (opts.debug) {
                  transport.setDebugMode(true);
                }
                // wait 1 min for result
                transport.setExchangeTimeout(60000);
                hwapp = new _hwAppIota2.default(transport);
                _context8.next = 9;
                return LedgerGuard._setInternalSeed(hwapp, 2);

              case 9:
                _context8.next = 11;
                return hwapp.getPubKey(0);

              case 11:
                keyAddress = _context8.sent;
                return _context8.abrupt('return', new LedgerGuard(hwapp, keyAddress.substr(0, 32), opts));

              case 13:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function build(_x15) {
        return _ref8.apply(this, arguments);
      }

      return build;
    }()
  }, {
    key: '_setInternalSeed',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(hwapp, index) {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return hwapp.setSeedInput(LedgerGuard._getBipPath(1, index), 1);

              case 2:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function _setInternalSeed(_x16, _x17) {
        return _ref9.apply(this, arguments);
      }

      return _setInternalSeed;
    }()
  }, {
    key: '_getBipPath',
    value: function _getBipPath(change, index) {
      var path = BIP44_PATH.slice();
      path[3] = change;
      path[4] = index;
      return path;
    }
  }]);

  return LedgerGuard;
}(BaseGuard);

module.exports = LedgerGuard;