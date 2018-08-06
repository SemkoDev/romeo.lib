const keys = require('../keys');
const { expect } = require('chai');

describe('crypto.keys', () => {
  it('should generate correct keys', () => {
    const result = {
      service: 'UAABRCTCZAWABBPCQCTCUASCVATCQCCBZAXAYA9BWAABUCQCRCCBSCYAVAUCVASCCBUASCPCZAPCQCYAP',
      ledger: 'CSCTCQCRCWAPCPCTC9BCBZAVAXAQCWAQCBBSCSCPCWAUATCUCABABXARCCBWAVA9BWAZAWASCWAUACBUC',
      password: 'ABABXAYARCABCBZAABABAB9BVACBVA9B',
      passwordExt: 'ABABXAYARCABCBZAABABAB9BVACBVA9BSCUC9BUAQCPCZAQCTCSCRCUAZAVASCXAABRCZAQCPCXAUCRCA',
      extra: 'BYAWASCABS',
      checksum: 'CYA'
    };
    const key = keys.getKeys('Maximilian', 'Mustermann');
    expect(key).to.deep.equal(result);
  });

  it('should return correct seeds', () => {
    const key = keys.getKeys('Maximilian', 'Mustermann');
    const ledgerSeed = keys.getSeed(key.ledger, key.passwordExt);
    expect(ledgerSeed).to.have.lengthOf(81);
    expect(ledgerSeed).to.equal('WHKEVUBDAMQIHDXFVRCAOVCCNZPJEQVHWYZOHUPQRFACHKWCXGGVPJFKOOHUFWOX9TXZIBPADJIGHF9VY');
  })
});