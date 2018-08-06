const PouchDB =
  typeof window === 'object' ? require('pouchdb').default : require('pouchdb');
const { toTrytes } = require('iota.lib.js/lib/utils/asciiToTrytes');
const { isTrytes } = require('iota.lib.js/lib/utils/inputValidator');
const crypto = require('./crypto');

const DEFAULT_OPTIONS = {
  path: 'romeo',
  password: ''
};

class Database {
  constructor(options) {
    this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    this.db = new PouchDB(this.opts.path);
  }

  _key(key) {
    return crypto.keys.getSeed(
      isTrytes(key) ? key : toTrytes(key),
      this.opts.password
    );
  }

  put(key, data) {
    const encrypted = crypto.crypto.encrypt(
      JSON.stringify(data),
      this.opts.password
    );
    key = this._key(key);

    return new Promise(resolve => {
      this.db
        .get(key)
        .then(doc => {
          this.db
            .put({ _id: key, _rev: doc._rev, data: encrypted })
            .then(() => resolve(true))
            .catch(() => resolve(false));
        })
        .catch(err => {
          this.db
            .put({ _id: key, data: encrypted })
            .then(() => resolve(true))
            .catch(() => resolve(false));
        });
    });
  }

  get(key) {
    return new Promise(resolve => {
      this.db
        .get(this._key(key))
        .then(doc => {
          const { data } = doc;
          const jsonString = crypto.crypto.decrypt(data, this.opts.password);
          try {
            resolve(JSON.parse(jsonString));
          } catch (e) {
            resolve(null);
          }
        })
        .catch(err => {
          resolve(null);
        });
    });
  }

  getMany(keys) {
    keys = keys.map(key => this._key(key));
    return new Promise((resolve, reject) => {
      this.db
        .allDocs({
          include_docs: true,
          keys
        })
        .then(result => {
          resolve(
            result.rows.map(row => {
              return row.error
                ? null
                : JSON.parse(
                    crypto.crypto.decrypt(row.doc.data, this.opts.password)
                  );
            })
          );
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  backup(asString = false) {
    return new Promise((resolve, reject) => {
      this.db
        .allDocs({
          include_docs: true
        })
        .then(result => {
          const docs = result.rows.map(row => ({
            data: row.doc.data,
            _id: row.doc._id
          }));
          resolve(asString ? JSON.stringify(docs) : docs);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  restore(data, asString = false) {
    if (asString) {
      data = JSON.parse(data);
    }
    return new Promise(resolve => {
      this.db
        .bulkDocs(data)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  Database
};
