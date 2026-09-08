import User from '../models/User.js';
import SearchHistory from '../models/SearchHistory.js';
import Notification from '../models/Notification.js';
// @desc    Search users by name or username
// @route   GET /api/users
// @access  Private
export const searchUsers = async (req, res, next) => {
  const queryStr = req.query.search ? req.query.search.trim() : '';

  try {
    const blockedByMe = req.user.blockedUsers || [];
    const queryConditions = { 
      _id: { $ne: req.user._id, $nin: blockedByMe },
      blockedUsers: { $ne: req.user._id }
    };

    if (queryStr) {
      queryConditions.$or = [
        { name: { $regex: queryStr, $options: 'i' } },
        { username: { $regex: queryStr, $options: 'i' } },
      ];
    }

    const users = await User.find(queryConditions)
      .select('_id name username avatar status followers followRequests')
      .limit(20)
      .lean();

    // Save search history if query is provided
    if (queryStr) {
      try {
        await SearchHistory.findOneAndUpdate(
          { user: req.user._id, query: queryStr },
          { user: req.user._id, query: queryStr },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (e) {}
    }

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's search history
// @route   GET /api/users/search/history
// @access  Private
export const getSearchHistory = async (req, res, next) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('searchedUser', 'name username avatar status');
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific search history item
// @route   DELETE /api/users/search/history/:id
// @access  Private
export const deleteSearchHistoryItem = async (req, res, next) => {
  try {
    const historyItem = await SearchHistory.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!historyItem) {
      res.status(404);
      throw new Error('Search history item not found');
    }

    await historyItem.deleteOne();
    res.json({ message: 'Search history item deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all search history for logged in user
// @route   DELETE /api/users/search/history
// @access  Private
export const clearSearchHistory = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'Search history cleared' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name username avatar status')
      .populate('following', 'name username avatar status')
      .populate('followRequests', 'name username avatar status');

    if (user) {
      // Save to search history if the viewed user is not the logged-in user
      if (req.user._id.toString() !== req.params.id) {
        await SearchHistory.findOneAndUpdate(
          { user: req.user._id, searchedUser: req.params.id },
          { user: req.user._id, searchedUser: req.params.id },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      // Check relationship status
      const isFollowing = user.followers.some(f => (f._id || f).toString() === req.user._id.toString());
      const isOwnProfile = req.user._id.toString() === user._id.toString();
      const hasRequested = user.followRequests.some(r => (r._id || r).toString() === req.user._id.toString());

      const userObj = user.toJSON();
      userObj.isPrivate = user.isPrivate || false;
      userObj.hasRequested = hasRequested;
      userObj.isFollowing = isFollowing;

      res.json(userObj);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.status = req.body.status || user.status;
      user.avatar = req.body.avatar || user.avatar;

      if (req.body.username) {
        let formattedUsername = req.body.username.trim();
        if (!formattedUsername.startsWith('@')) {
          formattedUsername = `@${formattedUsername}`;
        }
        
        // Ensure username is unique if changed
        if (formattedUsername !== user.username) {
          const usernameExists = await User.findOne({ username: formattedUsername });
          if (usernameExists) {
            res.status(400);
            throw new Error('Username is already taken');
          }
          user.username = formattedUsername;
        }
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.body.isPrivate !== undefined) {
        user.isPrivate = req.body.isPrivate;
      }

      const updatedUser = await user.save();

      // Broadcast profile updates in real-time to active connections
      try {
        const { getIO } = await import('../config/socket.js');
        const io = getIO();
        io.emit('user_updated', {
          _id: updatedUser._id,
          name: updatedUser.name,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          status: updatedUser.status,
          bio: updatedUser.bio,
          isPrivate: updatedUser.isPrivate,
        });
      } catch (socketErr) {
        console.error('Failed to emit user_updated socket event:', socketErr);
      }

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        status: updatedUser.status,
        followers: updatedUser.followers,
        following: updatedUser.following,
        isPrivate: updatedUser.isPrivate,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
export const toggleFollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      res.status(400);
      throw new Error('You cannot follow yourself');
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    const isBlockedByTarget = targetUser.blockedUsers && targetUser.blockedUsers.includes(currentUserId);
    const hasBlockedTarget = currentUser.blockedUsers && currentUser.blockedUsers.includes(targetUserId);

    if (isBlockedByTarget || hasBlockedTarget) {
      res.status(403);
      throw new Error('Action forbidden: User is blocked');
    }

    const isFollowing = currentUser.following.some(id => (id._id || id).toString() === targetUserId);
    const hasRequested = targetUser.followRequests.some(id => (id._id || id).toString() === currentUserId.toString());

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => (id._id || id).toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => (id._id || id).toString() !== currentUserId.toString()
      );
      await currentUser.save();
      await targetUser.save();

      // Delete any follow notifications between them
      await Notification.deleteMany({
        sender: currentUserId,
        receiver: targetUserId,
      });

      return res.json({
        message: 'Unfollowed successfully',
        status: 'unfollowed',
      });
    } else if (hasRequested) {
      // Cancel follow request
      targetUser.followRequests = targetUser.followRequests.filter(
        (id) => (id._id || id).toString() !== currentUserId.toString()
      );
      await targetUser.save();

      // Delete notification
      await Notification.deleteOne({
        sender: currentUserId,
        receiver: targetUserId,
        type: 'follow_request',
      });

      return res.json({
        message: 'Follow request cancelled',
        status: 'cancelled',
      });
    } else {
      // If target user is private, send request. Otherwise follow directly!
      if (targetUser.isPrivate) {
        if (!targetUser.followRequests.some(id => (id._id || id).toString() === currentUserId.toString())) {
          targetUser.followRequests.push(currentUserId);
          await targetUser.save();
        }

        const newNotif = await Notification.create({
          sender: currentUserId,
          receiver: targetUserId,
          type: 'follow_request',
          message: 'sent you a follow request.',
        });

        const populatedNotif = await Notification.findById(newNotif._id).populate('sender', 'name username avatar status');

        try {
          const { getIO } = await import('../config/socket.js');
          const io = getIO();
          io.to(targetUserId.toString()).emit('notification_received', populatedNotif);
        } catch (err) {}

        return res.json({
          message: 'Follow request sent',
          status: 'requested',
        });
      } else {
        if (!currentUser.following.some(id => (id._id || id).toString() === targetUserId)) {
          currentUser.following.push(targetUserId);
        }
        if (!targetUser.followers.some(id => (id._id || id).toString() === currentUserId.toString())) {
          targetUser.followers.push(currentUserId);
        }
        await currentUser.save();
        await targetUser.save();

        const newNotif = await Notification.create({
          sender: currentUserId,
          receiver: targetUserId,
          type: 'request_accepted',
          message: 'started following you.',
        });

        const populatedNotif = await Notification.findById(newNotif._id).populate('sender', 'name username avatar status');

        try {
          const { getIO } = await import('../config/socket.js');
          const io = getIO();
          io.to(targetUserId.toString()).emit('notification_received', populatedNotif);
        } catch (err) {}

        return res.json({
          message: 'Followed successfully',
          status: 'followed',
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a follow request
// @route   POST /api/users/requests/:id/accept
// @access  Private
export const acceptFollowRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const requesterUser = await User.findById(requesterId);

    if (!currentUser || !requesterUser) {
      res.status(404);
      throw new Error('User not found');
    }

    const hasRequest = currentUser.followRequests.some(id => (id._id || id).toString() === requesterId);

    if (!hasRequest) {
      res.status(400);
      throw new Error('No follow request found from this user');
    }

    // Move from requests to followers
    currentUser.followRequests = currentUser.followRequests.filter(
      (id) => (id._id || id).toString() !== requesterId
    );
    if (!currentUser.followers.some(id => (id._id || id).toString() === requesterId)) {
      currentUser.followers.push(requesterId);
    }

    // Add current user to requester's following
    if (!requesterUser.following.some(id => (id._id || id).toString() === currentUserId.toString())) {
      requesterUser.following.push(currentUserId);
    }

    await currentUser.save();
    await requesterUser.save();

    // Delete follow request notification
    await Notification.deleteOne({
      sender: requesterId,
      receiver: currentUserId,
      type: 'follow_request',
    });

    // Create follow accept notification
    const newNotif = await Notification.create({
      sender: currentUserId,
      receiver: requesterId,
      type: 'follow_accept',
      message: 'accepted your follow request.',
    });

    const populatedNotif = await Notification.findById(newNotif._id).populate('sender', 'name username avatar status');

    try {
      const { getIO } = await import('../config/socket.js');
      const io = getIO();
      io.to(requesterId.toString()).emit('notification_received', populatedNotif);
    } catch (err) {
      console.error('Socket emit notification error:', err);
    }

    res.json({ message: 'Follow request accepted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline a follow request
// @route   POST /api/users/requests/:id/decline
// @access  Private
export const declineFollowRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Remove from requests list
    currentUser.followRequests = currentUser.followRequests.filter(
      (id) => (id._id || id).toString() !== requesterId
    );
    await currentUser.save();

    // Delete request notification
    await Notification.deleteOne({
      sender: requesterId,
      receiver: currentUserId,
      type: 'follow_request',
    });

    res.json({ message: 'Follow request declined successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
export const blockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      res.status(400);
      throw new Error('You cannot block yourself');
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!currentUser.blockedUsers) {
      currentUser.blockedUsers = [];
    }

    if (!currentUser.blockedUsers.some(id => id.toString() === targetUserId)) {
      currentUser.blockedUsers.push(targetUserId);

      // Remove from following / followers
      currentUser.following = (currentUser.following || []).filter(id => id && id.toString() !== targetUserId);
      currentUser.followers = (currentUser.followers || []).filter(id => id && id.toString() !== targetUserId);
      currentUser.followRequests = (currentUser.followRequests || []).filter(id => id && id.toString() !== targetUserId);

      await currentUser.save();

      // Also clean up target user's relations to current user
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        targetUser.following = (targetUser.following || []).filter(id => id && id.toString() !== currentUserId.toString());
        targetUser.followers = (targetUser.followers || []).filter(id => id && id.toString() !== currentUserId.toString());
        targetUser.followRequests = (targetUser.followRequests || []).filter(id => id && id.toString() !== currentUserId.toString());
        await targetUser.save();
      }
    }

    res.json({ message: 'User blocked successfully', status: 'blocked' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock a user
// @route   DELETE /api/users/:id/block
// @access  Private
export const unblockUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    if (currentUser.blockedUsers) {
      currentUser.blockedUsers = (currentUser.blockedUsers || []).filter(
        id => id && id.toString() !== targetUserId
      );
      await currentUser.save();
    }

    res.json({ message: 'User unblocked successfully', status: 'unblocked' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of blocked users
// @route   GET /api/users/blocked
// @access  Private
export const getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'blockedUsers',
      'name username avatar status'
    );
    res.json(user ? user.blockedUsers || [] : []);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's notifications feed
// @route   GET /api/users/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ receiver: req.user._id })
      .populate('sender', 'name username avatar status')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user's notifications as read
// @route   PUT /api/users/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { receiver: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password inside Settings
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Please enter current password and new password');
    }

    const user = await User.findById(req.user._id);

    if (!user || !(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    // Set new password (will trigger pre-save hashing)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept group addition request
// @route   POST /api/users/group-requests/:notifId/accept
// @access  Private
export const acceptGroupAddRequest = async (req, res, next) => {
  try {
    const notifId = req.params.notifId;
    const currentUserId = req.user._id;

    const Chat = (await import('../models/Chat.js')).default;

    const notif = await Notification.findById(notifId);
    if (!notif) {
      res.status(404);
      throw new Error('Notification request not found');
    }

    // Verify current user is receiver (admin)
    if (notif.receiver.toString() !== currentUserId.toString()) {
      res.status(403);
      throw new Error('Only the group administrator can approve this request');
    }

    const chatId = notif.relatedChat;
    const userId = notif.relatedUser;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error('Group chat not found');
    }

    // Add target user to group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { members: userId } },
      { new: true }
    )
      .populate('members', 'name username avatar status')
      .populate('lastMessage');

    // Notify the added user via Socket.io
    try {
      const { getIO } = await import('../config/socket.js');
      const io = getIO();
      
      // Emit to the added user
      io.to(`user:${userId.toString()}`).to(userId.toString()).emit('added_to_group', {
        chatId: updatedChat._id,
        name: updatedChat.name,
        avatar: updatedChat.avatar,
        creatorName: req.user.name,
      });

      // Emit chat updated to everyone in the chat room so their lists reload
      io.to(chatId.toString()).emit('chat_updated', updatedChat);
    } catch (socketErr) {
      console.error('Failed to emit group addition socket events:', socketErr);
    }

    // Delete the notification
    await Notification.findByIdAndDelete(notifId);

    res.json({ message: 'Group addition approved successfully', chat: updatedChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline group addition request
// @route   POST /api/users/group-requests/:notifId/decline
// @access  Private
export const declineGroupAddRequest = async (req, res, next) => {
  try {
    const notifId = req.params.notifId;
    const currentUserId = req.user._id;

    const notif = await Notification.findById(notifId);
    if (!notif) {
      res.status(404);
      throw new Error('Notification request not found');
    }

    if (notif.receiver.toString() !== currentUserId.toString()) {
      res.status(403);
      throw new Error('Only the group administrator can decline this request');
    }

    // Delete the notification
    await Notification.findByIdAndDelete(notifId);

    res.json({ message: 'Group addition declined successfully' });
  } catch (error) {
    next(error);
  }
};

