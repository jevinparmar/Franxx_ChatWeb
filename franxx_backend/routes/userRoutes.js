import express from 'express';
import {
  searchUsers,
  getUserById,
  updateUserProfile,
  toggleFollowUser,
  getSearchHistory,
  clearSearchHistory,
  deleteSearchHistoryItem,
  acceptFollowRequest,
  declineFollowRequest,
  getNotifications,
  markNotificationsRead,
  blockUser,
  unblockUser,
  getBlockedUsers,
  changePassword,
  acceptGroupAddRequest,
  declineGroupAddRequest,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/').get(protect, searchUsers);
router.route('/profile').put(protect, updateUserProfile);
router.route('/change-password').put(protect, changePassword);
router.route('/blocked').get(protect, getBlockedUsers);

// File upload route for avatars
router.post('/upload-avatar', protect, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || err });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: fileUrl,
    });
  });
});

// Notifications & Requests endpoints (placed before /:id)
router
  .route('/notifications')
  .get(protect, getNotifications)
  .put(protect, markNotificationsRead)
  .patch(protect, markNotificationsRead);

router
  .route('/notifications/read')
  .put(protect, markNotificationsRead)
  .patch(protect, markNotificationsRead);

router
  .route('/notifications/read-all')
  .put(protect, markNotificationsRead)
  .patch(protect, markNotificationsRead);

router.route('/requests/:id/accept').post(protect, acceptFollowRequest);
router.route('/requests/:id/decline').post(protect, declineFollowRequest);

router.route('/group-requests/:id/accept').post(protect, acceptGroupAddRequest);
router.route('/group-requests/:id/decline').post(protect, declineGroupAddRequest);

// Search history endpoints (placed before /:id parameter matching)
router
  .route('/search/history')
  .get(protect, getSearchHistory)
  .delete(protect, clearSearchHistory);
router.route('/search/history/:id').delete(protect, deleteSearchHistoryItem);

router.route('/:id').get(protect, getUserById);
router.route('/:id/follow').post(protect, toggleFollowUser);
router.route('/:id/block').post(protect, blockUser).delete(protect, unblockUser);

export default router;
