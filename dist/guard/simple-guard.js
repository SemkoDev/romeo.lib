'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var crypto = require('../crypto');

var _require = require('./base'),
    BaseGuard = _require.BaseGuard;

/**
 * Simple username/password guard. Options to be provided:
 * - {string} username
 * - {string} password
 */


var SimpleGuard = function (_BaseGuard) {
  _inherits(SimpleGuard, _BaseGuard);

  function SimpleGuard(options) {
    _classCallCheck(this, SimpleGuard);

    // generate keys using username and password
    var _this = _possibleConstructorReturn(this, (SimpleGuard.__proto__ || Object.getPrototypeOf(SimpleGuard)).call(this, options));

    _this.keys = crypto.keys.getKeys(_this.opts.username, _this.opts.password);
    var _this$keys = _this.keys,
        ledger = _this$keys.ledger,
        password = _this$keys.password;
    // generate ledger-seed

    _this.seed = crypto.keys.getSeed(ledger, password);
    // cache of index-address values
    _this.pageAddresses = {};
    return _this;
  }

  _createClass(SimpleGuard, [{
    key: 'getPageSeed',
    value: function getPageSeed(pageIndex) {
      var cachedPageAddress = this.pageAddresses[pageIndex];
      return cachedPageAddress ? crypto.keys.getSeed(cachedPageAddress, this.keys.password) : null;
    }
  }, {
    key: 'getChecksum',
    value: function getChecksum() {
      return this.keys.checksum;
    }
  }, {
    key: 'getSymmetricKey',
    value: function getSymmetricKey() {
      return this.keys.password;
    }

    ///////// Private methods should not be called directly! /////////

  }, {
    key: '_getPages',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(index, total) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._getGenericAddresses(this.seed, index, total);

              case 2:
                return _context.abrupt('return', _context.sent);

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _getPages(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return _getPages;
    }()
  }, {
    key: '_getAddresses',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(index, total) {
        var seed;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._getPageSeed(this.activePageIndex);

              case 2:
                seed = _context2.sent;
                _context2.next = 5;
                return this._getGenericAddresses(seed, index, total);

              case 5:
                return _context2.abrupt('return', _context2.sent);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _getAddresses(_x3, _x4) {
        return _ref2.apply(this, arguments);
      }

      return _getAddresses;
    }()
  }, {
    key: '_getSignedTransactions',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(transfers, inputs, remainderAddress) {
        var _this2 = this;

        var seed, options;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._getPageSeed(this.activePageIndex);

              case 2:
                seed = _context3.sent;
                options = { inputs: inputs, address: remainderAddress.address };
                _context3.next = 6;
                return function () {
                  return new Promise(function (resolve, reject) {
                    _this2.iota.api.prepareTransfers(seed, transfers, options, function (err, result) {
                      if (err) return reject(err);
                      resolve(result);
                    });
                  });
                }();

              case 6:
                return _context3.abrupt('return', _context3.sent);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _getSignedTransactions(_x5, _x6, _x7) {
        return _ref3.apply(this, arguments);
      }

      return _getSignedTransactions;
    }()

    ///////// Custom methods not part of the guard interface /////////

    /**
     * Returns page seed by index
     * @param index
     * @returns {Promise<string>}
     * @private
     */

  }, {
    key: '_getPageSeed',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(index) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(index < 0)) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt('return', this.seed);

              case 2:
                _context4.t0 = crypto.keys;
                _context4.next = 5;
                return this._getPageAddressByIndex(index);

              case 5:
                _context4.t1 = _context4.sent;
                _context4.t2 = this.keys.password;
                return _context4.abrupt('return', _context4.t0.getSeed.call(_context4.t0, _context4.t1, _context4.t2));

              case 8:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _getPageSeed(_x8) {
        return _ref4.apply(this, arguments);
      }

      return _getPageSeed;
    }()

    /**
     * Returns page-address by index
     * @param {int} index
     * @returns {Promise<string>}
     * @private
     */

  }, {
    key: '_getPageAddressByIndex',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(index) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (this.pageAddresses[this.activePageIndex]) {
                  _context5.next = 4;
                  break;
                }

                _context5.next = 3;
                return this._getPages(this.activePageIndex, 1);

              case 3:
                this.pageAddresses[this.activePageIndex] = _context5.sent[0];

              case 4:
                return _context5.abrupt('return', this.pageAddresses[this.activePageIndex]);

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _getPageAddressByIndex(_x9) {
        return _ref5.apply(this, arguments);
      }

      return _getPageAddressByIndex;
    }()

    /**
     * Simple method to return addresses of given seed.
     * @param {string} seed
     * @param {int} index
     * @param {int} total
     * @returns {Promise<string[]>}
     * @private
     */

  }, {
    key: '_getGenericAddresses',
    value: function _getGenericAddresses(seed, index, total) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.iota.api.getNewAddress(seed, {
          returnAll: true,
          index: index,
          total: total
        }, function (err, result) {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }
  }]);

  return SimpleGuard;
}(BaseGuard);

module.exports = SimpleGuard;