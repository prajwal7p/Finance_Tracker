const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fintrack_dev_secret_key_987654321', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;
