const { expect } = require('chai');
const tmp = require('tmp');
const { SimpleGuard } = require('../../guard');
const createQueue = require('../../queue');
const { Page } = require('../page');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


describe('Romeo Page', () => {
  const username = 'Maximilian';
  const password = 'Mustermann999!--+';
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

  it('should init correctly', (done) => {
    const page = new Page({
      queue, iota, guard
      //onLog: (log) => console.log('onLog', log),
      //onChange: (page) => {} // console.log('onChange', JSON.stringify(page.addresses, null, 4))
    });
    page.init().then((page) => {
      done();
    })
  });

  it('should send transfers', (done) => {
    const page = new Page({
      queue, iota, guard
      //onLog: (log) => console.log('onLog', log),
      //onChange: (page) => {} // console.log('onChange', JSON.stringify(page.addresses, null, 4))
    });
    page.init().then((page) => {
      page.sendTransfers([ {
        address: 'AWE'.repeat(27),
        value: 0
      } ]).then((results) => {
        results.forEach((result) => expect(result.hash.length).to.equal(81));
        done();
      });
    })
  });

  it('should get new address', (done) => {
    const page = new Page({
      queue, iota, guard
      //onLog: (log) => console.log('onLog', log),
      //onChange: (page) => {} // console.log('onChange', JSON.stringify(page.addresses, null, 4))
    });
    page.init().then((page) => {
      const count = Object.keys(page.addresses).length;
      page.getNewAddress(2).then((results) => {
        expect(results.length).to.equal(2);
        expect(Object.keys(page.addresses).length - 2).to.equal(count);
        done();
      });
    })
  })
});