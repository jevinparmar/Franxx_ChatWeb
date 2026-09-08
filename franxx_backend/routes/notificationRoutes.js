import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotificationCount);
router.patch('/read-all', markAllNotificationsAsRead);
router.put('/read-all', markAllNotificationsAsRead);
router.patch('/read', markAllNotificationsAsRead);
router.put('/read', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);
router.put('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);

export default router;
