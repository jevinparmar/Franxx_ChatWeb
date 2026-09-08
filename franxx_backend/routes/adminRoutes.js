import express from 'express';
import { getAdminStats, getAdminUsers, getAdminChats } from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict admin route protection (verifies JWT authentication + admin role)
router.get('/stats', protect, requireAdmin, getAdminStats);
router.get('/users', protect, requireAdmin, getAdminUsers);
router.get('/chats', protect, requireAdmin, getAdminChats);

export default router;
