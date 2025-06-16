const Message = require('../model/Message');
const Chat = require('../model/Chat');
const User = require('../model/User');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, contentType = 'text', metadata, replyTo } = req.body;
    const userId = req.user.userId;

    // Check if chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this chat'
      });
    }

    // Create new message
    const message = new Message({
      chatId,
      sender: userId,
      content,
      contentType,
      metadata,
      replyTo
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = {
      messageId: message._id,
      content: message.content,
      sender: message.sender,
      timestamp: message.createdAt,
      contentType: message.contentType
    };
    await chat.save();

    // Populate sender details
    await message.populate('sender', 'username fullName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get messages for a chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Check if chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages in this chat'
      });
    }

    // Get messages
    const messages = await Message.find({
      chatId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username fullName profilePicture')
    .populate('replyTo');

    const total = await Message.countDocuments({
      chatId,
      isDeleted: false
    });

    // Mark messages as read
    const unreadMessages = messages.filter(
      message => !message.readBy.some(r => r.userId.toString() === userId)
    );

    for (const message of unreadMessages) {
      await message.markAsRead(userId);
    }

    res.json({
      success: true,
      messages: messages.reverse(),
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
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message'
      });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error editing message',
      error: error.message
    });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.softDelete();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// Add reaction to a message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.addReaction(userId, emoji);

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding reaction',
      error: error.message
    });
  }
};

// Remove reaction from a message
exports.removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.removeReaction(userId);

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing reaction',
      error: error.message
    });
  }
}; 