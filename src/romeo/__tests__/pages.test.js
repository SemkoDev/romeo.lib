const { expect } = require('chai');
const tmp = require('tmp');
const crypto = require('../../crypto');
const createQueue = require('../../queue');
const createAPI = require('../../iota');
const { Pages } = require('../pages');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


describe('Romeo Pages', () => {
  const keys = crypto.keys.getKeys('Maximilian', 'Mustermann999!!!!!');
  let iota = null;
  let queue = null;

  beforeEach(() => {
    iota = createAPI({
      path: tmp.dirSync().name,
      password: keys.password
    });
    queue = createQueue();
  });

  it('should init correctly and add new page', (done) => {
    const pages = new Pages({
      keys, queue, iota,
      //onLog: (log) => console.log('onLog', log),
      onChange: (pages) => {
        //console.log('CHANGED', pages.getAllJobs())
      }
    });
    pages.init().then((pages) => {
      const count = Object.keys(pages.pages).length;
      console.log('pages', count);
      pages.getNewPage().then((results) => {
        expect(results.length).to.equal(1);
        expect(Object.keys(pages.pages).length).to.equal(count + 1);
        done();
      });
    })
  });
});
