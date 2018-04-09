'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./base-page'),
    BasePage = _require.BasePage;

var _require2 = require('./page'),
    Page = _require2.Page;

var crypto = require('../crypto');

var DEFAULT_OPTIONS = {
  index: -1,
  isCurrent: true,
  queue: null,
  keys: null,
  iota: null,
  db: null
};

var Pages = function (_BasePage) {
  _inherits(Pages, _BasePage);

  function Pages(options) {
    _classCallCheck(this, Pages);

    var opts = Object.assign({}, DEFAULT_OPTIONS, {
      logIdent: 'PAGE #' + (options.index || DEFAULT_OPTIONS.index)
    }, options);
    var _opts$keys = opts.keys,
        ledger = _opts$keys.ledger,
        password = _opts$keys.password;

    opts.seed = crypto.keys.getSeed(ledger, password);

    var _this = _possibleConstructorReturn(this, (Pages.__proto__ || Object.getPrototypeOf(Pages)).call(this, opts));

    _this.pages = _this.addresses;
    _this.getNewPage = _this.getNewAddress;
    return _this;
  }

  _createClass(Pages, [{
    key: 'asJson',
    value: function asJson() {
      return Object.values(this.pages).map(function (p) {
        var address = p.address,
            seed = p.seed,
            keyIndex = p.keyIndex,
            page = p.page;

        return { address: address, seed: seed, keyIndex: keyIndex, page: page.asJson() };
      });
    }
  }, {
    key: 'getAllJobs',
    value: function getAllJobs() {
      return Object.values(this.opts.queue.jobs).filter(function (j) {
        return Number.isInteger(j.opts && j.opts.page);
      });
    }
  }, {
    key: 'applyAddresses',
    value: function applyAddresses(addresses) {
      var _this2 = this;

      var _opts = this.opts,
          password = _opts.keys.password,
          queue = _opts.queue,
          iota = _opts.iota,
          db = _opts.db;

      var startIndex = Object.keys(this.pages).filter(function (e) {
        return !addresses.includes(e);
      }).length;
      var currentPage = null;
      var otherPages = [];

      addresses && addresses.length && Object.values(this.pages).forEach(function (page) {
        return page.page.setCurrent(false);
      });

      addresses.forEach(function (address, keyIndex) {
        if (!_this2.pages[address]) {
          var onChange = _this2.onChange;

          var index = keyIndex + startIndex;
          var isCurrent = keyIndex === addresses.length - 1;
          var seed = crypto.keys.getSeed(address, password);
          var page = new Page({
            db: db,
            queue: queue,
            iota: iota,
            index: index,
            seed: seed,
            isCurrent: isCurrent,
            onChange: onChange
          });

          _this2.pages[address] = {
            address: address,
            seed: seed,
            keyIndex: index,
            page: page
          };
          if (isCurrent) {
            currentPage = page;
          } else {
            otherPages.push(page);
          }
        }
      });
      Object.values(this.pages).sort(function (a, b) {
        return b.keyIndex - a.keyIndex;
      })[0].page.setCurrent(true);
      if (currentPage) {
        currentPage.init(true, 6000).then(function () {
          return Promise.all(otherPages.map(function (p) {
            return p.init();
          }));
        });
      }
      this.onChange();
    }
  }, {
    key: 'getCurrent',
    value: function getCurrent() {
      var currentPage = Object.values(this.pages).find(function (p) {
        return p.page.isCurrent();
      });
      return currentPage ? currentPage.page : null;
    }
  }, {
    key: 'getByAddress',
    value: function getByAddress(pageAddress) {
      return Object.values(this.pages).find(function (p) {
        return p.address === pageAddress;
      });
    }
  }, {
    key: 'getByIndex',
    value: function getByIndex(index) {
      return Object.values(this.pages).find(function (p) {
        return p.keyIndex === index;
      });
    }
  }, {
    key: 'syncPage',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(page) {
        var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 30;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return page.sync(force, priority);

              case 2:
                return _context.abrupt('return', _context.sent);

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function syncPage(_x3) {
        return _ref.apply(this, arguments);
      }

      return syncPage;
    }()
  }, {
    key: 'syncCurrentPage',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var priority = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 30;
        var currentPage;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                currentPage = this.getCurrent();

                if (!(currentPage && !currentPage.isSynced())) {
                  _context2.next = 7;
                  break;
                }

                _context2.next = 4;
                return this.syncPage(currentPage, true, priority);

              case 4:
                _context2.t0 = _context2.sent;
                _context2.next = 8;
                break;

              case 7:
                _context2.t0 = null;

              case 8:
                return _context2.abrupt('return', _context2.t0);

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function syncCurrentPage() {
        return _ref2.apply(this, arguments);
      }

      return syncCurrentPage;
    }()
  }]);

  return Pages;
}(BasePage);

module.exports = {
  DEFAULT_OPTIONS: DEFAULT_OPTIONS,
  Pages: Pages
};