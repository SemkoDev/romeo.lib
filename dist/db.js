'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PouchDB = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' ? require('pouchdb').default : require('pouchdb');

var _require = require('iota.lib.js/lib/utils/asciiToTrytes'),
    toTrytes = _require.toTrytes;

var _require2 = require('iota.lib.js/lib/utils/inputValidator'),
    isTrytes = _require2.isTrytes;

var crypto = require('./crypto');

var DEFAULT_OPTIONS = {
  path: 'romeo',
  password: ''
};

var Database = function () {
  function Database(options) {
    _classCallCheck(this, Database);

    this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    this.db = new PouchDB(this.opts.path);
  }

  _createClass(Database, [{
    key: '_key',
    value: function _key(key) {
      return crypto.keys.getSeed(isTrytes(key) ? key : toTrytes(key), this.opts.password);
    }
  }, {
    key: 'put',
    value: function put(key, data) {
      var _this = this;

      var encrypted = crypto.crypto.encrypt(JSON.stringify(data), this.opts.password);
      key = this._key(key);

      return new Promise(function (resolve) {
        _this.db.get(key).then(function (doc) {
          _this.db.put({ _id: key, _rev: doc._rev, data: encrypted }).then(function () {
            return resolve(true);
          }).catch(function () {
            return resolve(false);
          });
        }).catch(function (err) {
          _this.db.put({ _id: key, data: encrypted }).then(function () {
            return resolve(true);
          }).catch(function () {
            return resolve(false);
          });
        });
      });
    }
  }, {
    key: 'get',
    value: function get(key) {
      var _this2 = this;

      return new Promise(function (resolve) {
        _this2.db.get(_this2._key(key)).then(function (doc) {
          var data = doc.data;

          var jsonString = crypto.crypto.decrypt(data, _this2.opts.password);
          try {
            resolve(JSON.parse(jsonString));
          } catch (e) {
            resolve(null);
          }
        }).catch(function (err) {
          resolve(null);
        });
      });
    }
  }, {
    key: 'getMany',
    value: function getMany(keys) {
      var _this3 = this;

      keys = keys.map(function (key) {
        return _this3._key(key);
      });
      return new Promise(function (resolve, reject) {
        _this3.db.allDocs({
          include_docs: true,
          keys: keys
        }).then(function (result) {
          resolve(result.rows.map(function (row) {
            return row.error ? null : JSON.parse(crypto.crypto.decrypt(row.doc.data, _this3.opts.password));
          }));
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  }, {
    key: 'backup',
    value: function backup() {
      var _this4 = this;

      var asString = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      return new Promise(function (resolve, reject) {
        _this4.db.allDocs({
          include_docs: true
        }).then(function (result) {
          var docs = result.rows.map(function (row) {
            return {
              data: row.doc.data,
              _id: row.doc._id
            };
          });
          resolve(asString ? JSON.stringify(docs) : docs);
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  }, {
    key: 'restore',
    value: function restore(data) {
      var _this5 = this;

      var asString = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (asString) {
        data = JSON.parse(data);
      }
      return new Promise(function (resolve) {
        _this5.db.bulkDocs(data).then(function (result) {
          resolve(result);
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  }]);

  return Database;
}();

module.exports = {
  DEFAULT_OPTIONS: DEFAULT_OPTIONS,
  Database: Database
};