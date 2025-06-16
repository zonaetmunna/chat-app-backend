const Chat = require('../model/Chat');
const Message = require('../model/Message');
const User = require('../model/User');

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    const { type, name, description, participants } = req.body;
    const userId = req.user.userId;

    // Validate participants
    if (type === 'direct' && participants.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Direct chat must have exactly one participant'
      });
    }

    // Check if direct chat already exists
    if (type === 'direct') {
      const existingChat = await Chat.findOne({
        type: 'direct',
        'participants.userId': { $all: [userId, participants[0]] }
      });

      if (existingChat) {
        return res.status(200).json({
          success: true,
          message: 'Chat already exists',
          chat: existingChat
        });
      }
    }

    // Create new chat
    const chat = new Chat({
      type,
      name,
      description,
      participants: [
        { userId, role: 'admin' },
        ...participants.map(p => ({ userId: p }))
      ]
    });

    await chat.save();

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating chat',
      error: error.message
    });
  }
};

// Get user's chats
exports.getChats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const chats = await Chat.find({
      'participants.userId': userId
    })
    .sort({ 'lastMessage.timestamp': -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('participants.userId', 'username fullName profilePicture status')
    .populate('lastMessage.sender', 'username fullName profilePicture');

    const total = await Chat.countDocuments({
      'participants.userId': userId
    });

    res.json({
      success: true,
      chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chats',
      error: error.message
    });
  }
};

// Get chat by ID
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId)
      .populate('participants.userId', 'username fullName profilePicture status')
      .populate('lastMessage.sender', 'username fullName profilePicture');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat'
      });
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat',
      error: error.message
    });
  }
};

// Update chat
exports.updateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const participant = chat.participants.find(
      p => p.userId.toString() === userId.toString()
    );

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this chat'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'picture', 'settings'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        chat[key] = updates[key];
      }
    });

    await chat.save();

    res.json({
      success: true,
      message: 'Chat updated successfully',
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating chat',
      error: error.message
    });
  }
};

// Delete chat
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const participant = chat.participants.find(
      p => p.userId.toString() === userId.toString()
    );

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this chat'
      });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chatId });

    // Delete the chat
    await chat.remove();

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting chat',
      error: error.message
    });
  }
};

// Add participant to chat
exports.addParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: newUserId, role } = req.body;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const participant = chat.participants.find(
      p => p.userId.toString() === userId.toString()
    );

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add participants'
      });
    }

    await chat.addParticipant(newUserId, role);

    res.json({
      success: true,
      message: 'Participant added successfully',
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding participant',
      error: error.message
    });
  }
};

// Remove participant from chat
exports.removeParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: removeUserId } = req.body;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const participant = chat.participants.find(
      p => p.userId.toString() === userId.toString()
    );

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove participants'
      });
    }

    await chat.removeParticipant(removeUserId);

    res.json({
      success: true,
      message: 'Participant removed successfully',
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing participant',
      error: error.message
    });
  }
}; 