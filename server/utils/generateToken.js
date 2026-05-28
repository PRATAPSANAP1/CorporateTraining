const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateToken = (userId, role = 'student', sessionId = null) => {
  // Admin -> 1 day, Student -> 7 days
  const expiresIn = role === 'admin' ? '1d' : '7d';
  
  return jwt.sign({ id: userId, sessionId }, config.jwtSecret, {
    expiresIn,
  });
};

module.exports = generateToken;

