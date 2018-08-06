const tmp = require('tmp');
const { expect } = require('chai');
const { Database } = require('../db');
const crypto = require('../crypto');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

tmp.setGracefulCleanup();

describe('db', () => {
  const keys = crypto.keys.getKeys('Maximilian', 'Mustermann999!');
  let db = null;

  beforeEach(() => {
    db = new Database({
      path: tmp.dirSync().name,
      password: keys.password
    });
  });

  it('should save and load correctly', done => {
    const data = { test: 'true' };
    db.put('test', data).then(() => {
      db.get('test').then(data => {
        expect(data).to.deep.equal(data);
        done();
      });
    });
  });

  it('should load many correctly', done => {
    const item = { test: 'true' };
    db.put('test', item).then(() => {
      db.getMany(['best', 'test', 'rest']).then(data => {
        expect(data.length).to.equal(3);
        expect(data[0]).to.be.null;
        expect(data[2]).to.be.null;
        expect(data[1]).to.deep.equal(item);
        done();
      });
    });
  });

  it('should use the correct key', () => {
    expect(db._key('test')).to.equal(
      'COHTERXSNTZDXITLQHMHM9FTFHJJCGO9WDYQLODYTXUPJBFESXVOGY9NYMOAWLQXXLJHTSJANFQ9WXDHC'
    );
  });

  it('should backup and restore correctly', done => {
    const testData = {
      key1: { hello: 'World' },
      key2: { another: 1 },
      key3: { wel: 'come' }
    };
    Promise.all(
      Object.keys(testData).map(key => db.put(key, testData[key]))
    ).then(() => {
      db.backup(true).then(raw => {
        const db2 = new Database({
          path: tmp.dirSync().name,
          password: keys.password
        });
        db2.restore(raw, true).then(() => {
          db2.get('key2').then(result => {
            expect(result).to.deep.equal(testData.key2);
            done();
          });
        });
      });
    });
  });
});
