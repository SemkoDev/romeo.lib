const { expect } = require('chai');
const tmp = require('tmp');
const { SimpleGuard } = require('../../guard');
const createQueue = require('../../queue');
const { Pages } = require('../pages');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


describe('Romeo Pages', () => {
  const username = 'Maximilian';
  const password = 'Mustermann999!---';
  let guard = null;
  let iota = null;
  let queue = null;

  beforeEach(() => {
    guard = new SimpleGuard({ username, password });
    iota = guard.setupIOTA({
      path: tmp.dirSync().name
    });
    queue = createQueue();
  });

  it('should init correctly and add new page', (done) => {
    const pages = new Pages({
      guard, queue, iota,
      //onLog: (log) => console.log('onLog', log),
      onChange: (pages) => {
        //console.log('CHANGED', pages.getAllJobs())
      }
    });
    pages.init().then((pages) => {
      const count = Object.keys(pages.pages).length;
      pages.getNewPage().then((results) => {
        expect(results.length).to.equal(1);
        expect(Object.keys(pages.pages).length).to.equal(count + 1);
        done();
      });
    })
  });
});
