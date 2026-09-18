const jwt = require('jsonwebtoken');
const env = require('../config/env');

/** Signs a JWT carrying only the user id + role — never PII, never the password hash. */
function generateToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

module.exports = generateToken;
