const tmp = require('tmp');
const { expect } = require('chai');
const crypto = require('../crypto');
const { SimpleGuard } = require('../guard');
const createAPI = require('../iota');

tmp.setGracefulCleanup();

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

describe('api.iota', () => {
  const username = 'Maximilian';
  const password = 'Mustermann999!!!!--++';
  const keys = crypto.keys.getKeys(username, password);

  it('should get trytes correctly', done => {
    const iota = createAPI({
      path: tmp.dirSync().name,
      password: keys.password
    });

    iota.api.getTrytes(
      [
        'UWQEJXPDDGZW9KTRL9ROG9YOWIHYRBVGCNVHBAHVGHKFSQJBPJGWDJXPOYLLOC9AADSJGSSKUTIYA9999'
      ],
      (e, trytes) => {
        expect(e).to.be.null;

        iota.api.getTrytes(
          [
            'JECMCOQ9ZBHIKFQVWX9RHAFQNZWQBTZEZVNYASGEWJ9DAGHGQFWEAIPMOE9XCGMHMZRALDCTWLWE99999',
            'UWQEJXPDDGZW9KTRL9ROG9YOWIHYRBVGCNVHBAHVGHKFSQJBPJGWDJXPOYLLOC9AADSJGSSKUTIYA9999'
          ],
          (e, trytes) => {
            expect(e).to.be.null;
            done();
          }
        );
      }
    );
  });

  it('ext getBalances', done => {
    const iota = createAPI({
      path: tmp.dirSync().name,
      password: keys.password
    });
    const sum = balances => balances.reduce((t, i) => t + i, 0);
    const addresses = [
      'NOZJAQTAAQGGOXJNFGWTBWQFZXXI9VSHPJYABT9LLWCCMRTVJKLHJIXBT9YKDBAFRHWQVRSQAPWVFUISB',
      'HJLLUBXUMXSBETHZPCBBFHKUJIVEBCPOA9HAOWDQXJSYHZDCY9QQGVTKSMJQXQKEMMDECLSLMCAWYGPNY',
      'NJSUEEOVDHGCVHF9AFTPUFZAXFBINNVJCAHQQZNAWXNCRWANSOJGTGNUNICVFU9ZNJUYWGTTWTVJQVHJD',
      'BNQRGECJLPUHCTPZXROUXAVJXWOOZGYAJZABPNFPUJFNOOOFUQX99CV9ESORJHPVCEBNLTIQKSDGMFPFC',
      'BHIUEADCZYUT9FVQIHBCDEFLTDITOPHZUQWTWWTKSYRAWNKLX99GMWULWRBTKUSMHLFLGEKRDSRMCEOF9',
      'GWWI9KRAYABEFXVKGNGMFJSXSUZ9HHTWLDFSHFVRDQIYPVDHTX9GTQEBXKPBL9YAHPJTTVRJYYEETX9WW',
      'WWJKPEADXWDJRZJHY99WQEUBVQSTDNS9NPJQOYQUSVKOLAGBGULSSKDKSXFSCIHISIIPNATBXFIOIP9DD'
    ];

    iota.api.ext.getBalances(
      addresses,
      100,
      (error, balances) => {
        expect(error).to.be.null;
        expect(sum(balances)).to.equal(0);
      },
      (error, balances) => {
        expect(error).to.be.null;
        const total = sum(balances);
        expect(total).to.be.above(0);

        iota.api.ext.getBalances(
          addresses,
          100,
          (error, balances) => {
            expect(error).to.be.null;
            expect(sum(balances)).to.equal(total);
          },
          (error, balances) => {
            expect(error).to.be.null;
            const total2 = sum(balances);
            expect(total2).to.equal(total);
            done();
          }
        );
      }
    );
  });

  it('ext getSpent', done => {
    const iota = createAPI({
      path: tmp.dirSync().name,
      password: keys.password
    });
    const addresses = [
      'NOZJAQTAAQGGOXJNFGWTBWQFZXXI9VSHPJYABT9LLWCCMRTVJKLHJIXBT9YKDBAFRHWQVRSQAPWVFUISB',
      'HJLLUBXUMXSBETHZPCBBFHKUJIVEBCPOA9HAOWDQXJSYHZDCY9QQGVTKSMJQXQKEMMDECLSLMCAWYGPNY',
      'NJSUEEOVDHGCVHF9AFTPUFZAXFBINNVJCAHQQZNAWXNCRWANSOJGTGNUNICVFU9ZNJUYWGTTWTVJQVHJD',
      'BNQRGECJLPUHCTPZXROUXAVJXWOOZGYAJZABPNFPUJFNOOOFUQX99CV9ESORJHPVCEBNLTIQKSDGMFPFC',
      'BHIUEADCZYUT9FVQIHBCDEFLTDITOPHZUQWTWWTKSYRAWNKLX99GMWULWRBTKUSMHLFLGEKRDSRMCEOF9',
      'GWWI9KRAYABEFXVKGNGMFJSXSUZ9HHTWLDFSHFVRDQIYPVDHTX9GTQEBXKPBL9YAHPJTTVRJYYEETX9WW',
      'WWJKPEADXWDJRZJHY99WQEUBVQSTDNS9NPJQOYQUSVKOLAGBGULSSKDKSXFSCIHISIIPNATBXFIOIP9DD'
    ];

    iota.api.ext.getSpent(
      addresses,
      (error, states) => {
        expect(error).to.be.null;
        expect(states.length).to.equal(addresses.length);
        expect(states.filter(s => !s).length).to.equal(addresses.length);
      },
      (error, states) => {
        expect(error).to.be.null;
        expect(states.length).to.equal(addresses.length);

        iota.api.ext.getSpent(
          addresses,
          (error, states2) => {
            expect(error).to.be.null;
            expect(states2).to.deep.equal(states);
          },
          (error, states2) => {
            expect(error).to.be.null;
            expect(states2).to.deep.equal(states);
            done();
          }
        );
      }
    );
  });

  it('ext getAddresses', done => {
    const iota = createAPI({
      path: tmp.dirSync().name,
      password: keys.password
    });
    const seed = 'QWE'.repeat(27);

    iota.api.ext.getAddresses(
      seed,
      (error, addresses) => {
        expect(error).to.be.null;
        expect(addresses.length).to.equal(0);
      },
      (error, addresses) => {
        expect(error).to.be.null;
        expect(addresses.length).to.be.above(0);

        iota.api.ext.getAddresses(
          seed,
          (error, addresses2) => {
            expect(error).to.be.null;
            expect(addresses2.length).to.equal(addresses.length);
          },
          (error, addresses2) => {
            expect(error).to.be.null;
            expect(addresses2).to.deep.equal(addresses);
            done();
          }
        );
      }
    );
  });

  it('ext guard getAddresses', done => {
    const guard = new SimpleGuard({ username, password});
    const iota = guard.setupIOTA({ path: tmp.dirSync().name });
    const seed = 1; // page Number

    iota.api.ext.getAddresses(
      seed,
      (error, addresses) => {
        expect(error).to.be.null;
        expect(addresses.length).to.equal(0);
      },
      (error, addresses) => {
        expect(error).to.be.null;
        expect(addresses.length).to.be.above(0);

        iota.api.ext.getAddresses(
          seed,
          (error, addresses2) => {
            expect(error).to.be.null;
            expect(addresses2.length).to.equal(addresses.length);
          },
          (error, addresses2) => {
            expect(error).to.be.null;
            expect(addresses2).to.deep.equal(addresses);
            done();
          },
          false, 2
        );
      },
      false, 2
    );
  });

  it('ext guard getNewAddresses', done => {
    const guard = new SimpleGuard({ username, password});
    const iota = guard.setupIOTA({ path: tmp.dirSync().name });

    iota.api.ext.getNewAddress(
      1, 0, 2,
      (error, addresses) => {
        expect(error).to.be.null;
        expect(addresses.length).to.equal(2);
        done();
      }
    );
  });

  it('ext guard sendTransfer', done => {
    const guard = new SimpleGuard({ username, password});
    const iota = guard.setupIOTA({ path: tmp.dirSync().name });
    const transfers = [{
      address: 'FHA'.repeat(27),
      value: 0,
      tag: 'HELLO9WORLD'
    }];
    const options = {};

    iota.api.ext.sendTransfer(
      1, 4, 14, transfers, options,
      (error, trytes) => {
        expect(error).to.be.null;
        expect(trytes).to.have.length(1);
        expect(trytes[0].hash).to.have.length(81);
        done();
      }
    );
  });

  it('ext getTransactions', done => {
    const iota = createAPI({
      path: tmp.dirSync().name,
      password: keys.password
    });
    const address =
      'NOZJAQTAAQGGOXJNFGWTBWQFZXXI9VSHPJYABT9LLWCCMRTVJKLHJIXBT9YKDBAFRHWQVRSQAPWVFUISB';

    iota.api.ext.getTransactions(
      address,
      (err, result) => {
        const { hashes, inclusions } = result;
        expect(hashes.length).to.equal(0);
        expect(hashes.length).to.equal(inclusions.length);
      },
      (err, result) => {
        const { hashes, inclusions } = result;
        expect(hashes.length).to.be.above(0);
        expect(hashes.length).to.equal(inclusions.length);

        iota.api.ext.getTransactions(
          address,
          (err, result) => {
            const { hashes: h2, inclusions: i2 } = result;
            expect(h2).to.deep.equal(hashes);
            expect(i2).to.deep.equal(inclusions);
          },
          (err, result) => {
            const { hashes: h2, inclusions: i2 } = result;
            expect(h2).to.deep.equal(hashes);
            expect(i2).to.deep.equal(inclusions);
            done();
          }
        );
      }
    );
  });

  it('ext getTransactionObjects', done => {
    const iota = createAPI({
      path: tmp.dirSync().name,
      password: keys.password
    });
    const address =
      'NOZJAQTAAQGGOXJNFGWTBWQFZXXI9VSHPJYABT9LLWCCMRTVJKLHJIXBT9YKDBAFRHWQVRSQAPWVFUISB';

    iota.api.ext.getTransactionObjects(
      address,
      (err, result) => {
        expect(err).to.be.null;
        expect(result.length).to.equal(0);
      },
      (err, result) => {
        expect(err).to.be.null;
        expect(result.length).to.be.above(0);

        iota.api.ext.getTransactionObjects(
          address,
          (err, result2) => {
            expect(err).to.be.null;
            expect(result2).to.deep.equal(result);
          },
          (err, result2) => {
            expect(err).to.be.null;
            expect(result2).to.deep.equal(result);
            done();
          }
        );
      }
    );
  });
});
