const express = require('express');
const router = express.Router();
const chatController = require('../controller/chatController');
const messageController = require('../controller/messageController');
const { protect } = require('../middleware/auth');

// Chat routes
router.post('/', protect, chatController.createChat);
router.get('/', protect, chatController.getChats);
router.get('/:chatId', protect, chatController.getChat);
router.put('/:chatId', protect, chatController.updateChat);
router.delete('/:chatId', protect, chatController.deleteChat);
router.post('/:chatId/participants', protect, chatController.addParticipant);
router.delete('/:chatId/participants', protect, chatController.removeParticipant);

// Message routes
router.post('/:chatId/messages', protect, messageController.sendMessage);
router.get('/:chatId/messages', protect, messageController.getMessages);
router.put('/messages/:messageId', protect, messageController.editMessage);
router.delete('/messages/:messageId', protect, messageController.deleteMessage);
router.post('/messages/:messageId/reactions', protect, messageController.addReaction);
router.delete('/messages/:messageId/reactions', protect, messageController.removeReaction);

module.exports = router; 