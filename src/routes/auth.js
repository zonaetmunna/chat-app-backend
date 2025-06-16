const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', protect, authController.logout);

module.exports = router; 