const passwordValidator = require('password-validator');

const passwordSchema = new passwordValidator()
  .is()
  .min(12)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .symbols()
  .has()
  .digits();

const usernameSchema = new passwordValidator()
  .is()
  .min(8)
  .has()
  .uppercase()
  .has()
  .lowercase();

function isPassword(password) {
  const result = passwordSchema.validate(password, { list: true });
  return {
    valid: !result.length,
    errors: result
  };
}
function isUsername(username) {
  const result = usernameSchema.validate(username, { list: true });
  return {
    valid: !result.length,
    errors: result
  };
}

module.exports = {
  isPassword,
  isUsername
};
