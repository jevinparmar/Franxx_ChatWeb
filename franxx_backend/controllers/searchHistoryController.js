import SearchHistory from '../models/SearchHistory.js';
import User from '../models/User.js';

// @desc    Get user's search history
// @route   GET /api/search/history
// @access  Private
export const getSearchHistory = async (req, res, next) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ lastViewedAt: -1, updatedAt: -1 })
      .limit(30)
      .populate('searchedUser', 'name username avatar status bio');

    // Filter out items where searchedUser might be deleted or null
    const validHistory = history.filter(item => item.searchedUser != null);
    res.json(validHistory);
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update searched user in search history
// @route   POST /api/search/history/:searchedUserId
// @access  Private
export const addSearchHistoryItem = async (req, res, next) => {
  try {
    const searchedUserId = req.params.searchedUserId;
    if (searchedUserId === req.user._id.toString()) {
      return res.json({ message: 'Own profile not added to search history' });
    }

    const targetUser = await User.findById(searchedUserId);
    if (!targetUser) {
      res.status(404);
      throw new Error('Searched user not found');
    }

    const historyItem = await SearchHistory.findOneAndUpdate(
      { user: req.user._id, searchedUser: searchedUserId },
      { user: req.user._id, searchedUser: searchedUserId, lastViewedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('searchedUser', 'name username avatar status bio');

    res.json(historyItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove single item from search history
// @route   DELETE /api/search/history/:searchedUserId
// @access  Private
export const removeSearchHistoryItem = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({
      user: req.user._id,
      $or: [
        { searchedUser: req.params.searchedUserId },
        { _id: req.params.searchedUserId }
      ]
    });
    res.json({ message: 'Item removed from search history' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all search history
// @route   DELETE /api/search/history
// @access  Private
export const clearSearchHistory = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'Search history cleared' });
  } catch (error) {
    next(error);
  }
};
