const { expect } = require('chai');
const tmp = require('tmp');
const { Romeo } = require('../romeo');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


describe('Romeo', () => {
  let romeo = null;

  beforeEach(() => {
    romeo = new Romeo({
      dbPath: tmp.dirSync().name,
      username: 'Maximilian',
      password: 'Mustermann999!!!!!'
    });
  });

  it('should init correctly and add new page', (done) => {
    romeo.init().then((romeo) => {
      const count = Object.keys(romeo.pages.pages).length;
      console.log('pages', count);
      romeo.pages.getNewPage().then((results) => {
        expect(results.length).to.equal(1);
        expect(Object.keys(romeo.pages.pages).length).to.equal(count + 1);
        done();
      });
    })
  });
});
