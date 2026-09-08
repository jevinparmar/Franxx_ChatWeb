import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import chatRoutes from './chatRoutes.js';
import messageRoutes from './messageRoutes.js';
import statusRoutes from './statusRoutes.js';
import adminRoutes from './adminRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import searchHistoryRoutes from './searchHistoryRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/status', statusRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchHistoryRoutes);

export default router;
