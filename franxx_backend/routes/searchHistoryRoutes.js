import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getSearchHistory,
  addSearchHistoryItem,
  removeSearchHistoryItem,
  clearSearchHistory,
} from '../controllers/searchHistoryController.js';

const router = express.Router();

router.use(protect);

router.get('/history', getSearchHistory);
router.post('/history/:searchedUserId', addSearchHistoryItem);
router.delete('/history/:searchedUserId', removeSearchHistoryItem);
router.delete('/history', clearSearchHistory);

export default router;
