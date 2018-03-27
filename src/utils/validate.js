const passwordValidator = require('password-validator');

const passwordSchema = new passwordValidator()
  .is().min(8)
  .has().uppercase()
  .has().lowercase()
  .has().symbols()
  .has().digits();

function isPassword (password) {
  const result = passwordSchema.validate(password, { list: true });
  return {
    valid: !result.length,
    errors: result
  }
}

module.exports = {
  isPassword
};
