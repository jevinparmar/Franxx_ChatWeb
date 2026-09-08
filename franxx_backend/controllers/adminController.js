import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ status: 'Online' });
    const totalMessages = await Message.countDocuments();
    const totalChats = await Chat.countDocuments();
    
    res.json({
      totalUsers,
      onlineUsers,
      totalMessages,
      totalChats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chats list with message counts
// @route   GET /api/admin/chats
// @access  Private/Admin
export const getAdminChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({})
      .populate('members', 'name username avatar status')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Aggregate message counts per chat
    const messageCounts = await Message.aggregate([
      { $group: { _id: '$chat', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    messageCounts.forEach(mc => {
      countMap[mc._id.toString()] = mc.count;
    });

    const enrichedChats = chats.map(chat => ({
      ...chat.toObject(),
      messageCount: countMap[chat._id.toString()] || 0
    }));

    res.json(enrichedChats);
  } catch (error) {
    next(error);
  }
};
