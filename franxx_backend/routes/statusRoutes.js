import express from 'express';
import { createStatus, getAllStatuses, viewStatus, deleteStatus } from '../controllers/statusController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createStatus).get(protect, getAllStatuses);
router.route('/:id/view').put(protect, viewStatus);
router.route('/:id').delete(protect, deleteStatus);

export default router;
