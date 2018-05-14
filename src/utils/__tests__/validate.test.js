const validate = require('../validate');
const { expect } = require('chai');

describe('utils.validate', () => {
  it('should validate password correctly #1', () => {
    const { valid, errors } = validate.isPassword('HelloWorld123!');
    expect(valid).to.be.true
    expect(errors.length).to.equal(0);
  });
  it('should validate password correctly #2', () => {
    const { valid, errors } = validate.isPassword('HelloWorldWideWeb');
    expect(valid).to.be.false
    expect(errors.length).to.equal(2);
    expect(errors).to.deep.equal([ 'symbols', 'digits' ]);
  });
  it('should validate password correctly #3', () => {
    const { valid, errors } = validate.isPassword('He1!');
    expect(valid).to.be.false
    expect(errors.length).to.equal(1);
    expect(errors).to.deep.equal([ 'min' ]);
  });
});