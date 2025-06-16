const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String,
    required: function() {
      return this.type === 'group';
    }
  },
  description: String,
  picture: String,
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastRead: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    contentType: String
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  settings: {
    slowMode: Number,
    isPublic: {
      type: Boolean,
      default: false
    },
    joinLink: String
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ type: 1, 'participants.userId': 1 });

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.userId.toString() === userId.toString());
};

// Method to get chat participants
chatSchema.methods.getParticipants = async function() {
  await this.populate('participants.userId', 'username fullName profilePicture status');
  return this.participants;
};

// Method to add participant
chatSchema.methods.addParticipant = async function(userId, role = 'member') {
  if (!this.isParticipant(userId)) {
    this.participants.push({
      userId,
      role,
      joinedAt: new Date(),
      lastRead: new Date()
    });
    await this.save();
  }
};

// Method to remove participant
chatSchema.methods.removeParticipant = async function(userId) {
  this.participants = this.participants.filter(
    p => p.userId.toString() !== userId.toString()
  );
  await this.save();
};

// Method to update last read
chatSchema.methods.updateLastRead = async function(userId) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );
  if (participant) {
    participant.lastRead = new Date();
    await this.save();
  }
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat; 