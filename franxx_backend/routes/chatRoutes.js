import express from 'express';
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  deleteChatForUser,
  toggleMuteChat,
  togglePinChat,
  toggleArchiveChat,
  bulkActionChats,
  getChatMedia,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, accessChat).get(protect, fetchChats);
router.route('/bulk').post(protect, bulkActionChats);
router.route('/group').post(protect, createGroupChat);
router.route('/group/rename').put(protect, renameGroup);
router.route('/group/add').put(protect, addToGroup);
router.route('/group/remove').put(protect, removeFromGroup);
router.route('/:id').delete(protect, deleteChatForUser);
router.route('/:id/mute').put(protect, toggleMuteChat);
router.route('/:id/pin').put(protect, togglePinChat);
router.route('/:id/archive').put(protect, toggleArchiveChat);
router.route('/:id/media').get(protect, getChatMedia);

export default router;
