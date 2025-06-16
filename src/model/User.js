// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  profilePicture: {
    type: String
  },
  coverPhoto: {
    type: String
  },
  status: {
    type: String,
    enum: ['online', 'away', 'offline'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  settings: {
    privacy: {
      lastSeen: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone'
      },
      profilePhoto: {
        type: String,
        enum: ['everyone', 'contacts', 'nobody'],
        default: 'everyone'
      },
      readReceipts: {
        type: Boolean,
        default: true
      }
    },
    notifications: {
      newMessages: {
        type: Boolean,
        default: true
      },
      groupMessages: {
        type: Boolean,
        default: true
      },
      calls: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deviceTokens: [String]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.verificationToken;
  delete userObject.deviceTokens;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
