const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { generateVerificationToken } = require('../utils/tokenUtils');

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create verification token
    const verificationToken = generateVerificationToken();

    // Create new user
    const user = new User({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      fullName,
      verificationToken
    });

    await user.save();

    // TODO: Send verification email

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in registration',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in login',
      error: error.message
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { userId, token } = req.body;

    const user = await User.findOne({
      _id: userId,
      verificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in email verification',
      error: error.message
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in logout',
      error: error.message
    });
  }
}; 