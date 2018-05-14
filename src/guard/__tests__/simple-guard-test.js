const tmp = require('tmp');
const { expect } = require('chai');
const SimleGuard = require('../simple-guard');

tmp.setGracefulCleanup();

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

describe('guard.simple', () => {
  it('should init correctly', () => {
    const guard = new SimleGuard('Testtesttest!', '123TestTest Test!!="123');
    expect(guard.getSymmetricKey()).to.have.length(32);
  });

  it('should setup iota correctly', () => {
    const guard = new SimleGuard('Testtesttest!', '123TestTest Test!!="123');
    const iota = guard.setupIOTA({ path: tmp.dirSync().name });
    expect(!!iota).to.be.true;
    expect(!!iota.api.ext).to.be.true;
  });

  it('should get pages correctly', (done) => {
    const guard = new SimleGuard('Testtesttest!', '123TestTest Test!!="123');
    guard.setupIOTA({ path: tmp.dirSync().name });
    guard.getPages(0, 4).then(pages => {
      expect(pages).to.have.length(4);
      expect(pages[0]).to.have.length(81);
      expect(pages[1]).to.have.length(81);
      expect(pages[2]).to.have.length(81);
      expect(pages[3]).to.have.length(81);
      done();
    });
  });

  it('should get page addresses correctly', (done) => {
    const guard = new SimleGuard('Testtesttest!', '123TestTest Test!!="123');
    guard.setupIOTA({ path: tmp.dirSync().name });
    guard.getAddresses(1, 0, 4).then(addresses => {
      expect(addresses).to.have.length(4);
      expect(addresses[0]).to.have.length(81);
      expect(addresses[1]).to.have.length(81);
      expect(addresses[2]).to.have.length(81);
      expect(addresses[3]).to.have.length(81);
      done();
    });
  });

  it('should sign correctly', (done) => {
    const guard = new SimleGuard('Testtesttest!', '123TestTest Test!!="123');
    guard.setupIOTA({ path: tmp.dirSync().name });
    // TODO: write a meaningful signature test :)
    done();
  });
});