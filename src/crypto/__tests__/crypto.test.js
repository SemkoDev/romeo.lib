const crypto = require('../crypto');
const { expect } = require('chai');

describe('crypto.crypto', () => {
  it('should encrypt and decrypt correctly', () => {
    const text = 'Hello World!';
    const password = '12345678901234567890123456789012';
    const enc = crypto.encrypt(text, password);
    const dec = crypto.decrypt(enc, password);
    expect(text).to.equal(dec);
  });
});