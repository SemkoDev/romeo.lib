const { expect } = require('chai');
const tmp = require('tmp');
const crypto = require('../../crypto');
const createQueue = require('../../queue');
const createAPI = require('../../iota');
const { Page } = require('../page');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


describe('Romeo Page', () => {
  const keys = crypto.keys.getKeys('Maximilian', 'Mustermann999!!!!!');
  const seed = 'AAAVGP9TVQZWPWXDSUQDOBGGHCADNZDUSRIQGAGZQWRNJKSRFOMYYJXHPZ9LKPVLLFYPCFVJYERCKWAAA';
  let iota = null;
  let queue = null;

  beforeEach(() => {
    iota = createAPI({
      path: tmp.dirSync().name,
      password: keys.password
    });
    queue = createQueue();
  });

  it('should init correctly', (done) => {
    const page = new Page({
      seed, queue, iota,
      //onLog: (log) => console.log('onLog', log),
      //onChange: (page) => {} // console.log('onChange', JSON.stringify(page.addresses, null, 4))
    });
    page.init().then((page) => {
      done();
    })
  });

  it('should send transfers', (done) => {
    const page = new Page({
      seed, queue, iota,
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
      seed, queue, iota,
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