import Notification from '../models/Notification.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ receiver: req.user._id })
      .populate('sender', 'name username avatar status')
      .populate('relatedUser', 'name username avatar status')
      .populate('relatedChat', 'name type')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread
// @access  Private
export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      receiver: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      receiver: req.user._id,
    });

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { receiver: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification by ID
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      receiver: req.user._id,
    });

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    await notification.deleteOne();
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};
