const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'fintrack_dev_secret_key_987654321';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;
