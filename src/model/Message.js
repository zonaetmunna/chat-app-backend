const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'location'],
    default: 'text'
  },
  metadata: {
    fileName: String,
    fileSize: Number,
    fileType: String,
    fileUrl: String,
    thumbnailUrl: String,
    duration: Number,
    width: Number,
    height: Number,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  encryptionKey: String
}, {
  timestamps: true
});

// Indexes for faster queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.userId': 1 });

// Method to mark message as read
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.some(r => r.userId.toString() === userId.toString())) {
    this.readBy.push({
      userId,
      timestamp: new Date()
    });
    await this.save();
  }
};

// Method to add reaction
messageSchema.methods.addReaction = async function(userId, emoji) {
  const existingReaction = this.reactions.find(
    r => r.userId.toString() === userId.toString()
  );

  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.timestamp = new Date();
  } else {
    this.reactions.push({
      userId,
      emoji,
      timestamp: new Date()
    });
  }

  await this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(
    r => r.userId.toString() !== userId.toString()
  );
  await this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 
