const crypto = require('crypto');

// Generate a random verification token
exports.generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate a random reset token
exports.generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate a random invite token
exports.generateInviteToken = () => {
  return crypto.randomBytes(16).toString('hex');
}; 