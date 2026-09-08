import express from 'express';
import { sendMessage, allMessages, markChatMessagesRead, deleteMessage, getSharedMedia } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/read/:chatId').patch(protect, markChatMessagesRead).put(protect, markChatMessagesRead);
router.route('/shared/media').get(protect, getSharedMedia);
router.route('/:chatId').get(protect, allMessages);
router.route('/:id').delete(protect, deleteMessage);

export default router;
