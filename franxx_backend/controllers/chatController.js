import Chat from '../models/Chat.js';
import User from '../models/User.js';

// @desc    Access or create a 1-to-1 individual chat
// @route   POST /api/chats
// @access  Private
export const accessChat = async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    return next(new Error('UserId param not sent with request'));
  }

  try {
    if (userId === req.user._id.toString()) {
      res.status(400);
      return next(new Error('You cannot start a chat with yourself'));
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const isBlockedByTarget = targetUser.blockedUsers && targetUser.blockedUsers.includes(req.user._id);
    const hasBlockedTarget = req.user.blockedUsers && req.user.blockedUsers.includes(userId);

    if (isBlockedByTarget || hasBlockedTarget) {
      res.status(403);
      return next(new Error('Action forbidden: User is blocked'));
    }

    // Look for an existing 1-to-1 chat between the two users
    let isChat = await Chat.find({
      type: 'individual',
      $and: [
        { members: { $elemMatch: { $eq: req.user._id } } },
        { members: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('members', 'name username avatar status')
      .populate('lastMessage');

    isChat = await User.populate(isChat, {
      path: 'lastMessage.sender',
      select: 'name username avatar email status',
    });

    if (isChat.length > 0) {
      let chat = isChat[0].toObject();
      if (chat.lastMessage && chat.lastMessage.deletedFor && 
          chat.lastMessage.deletedFor.some(id => id.toString() === req.user._id.toString())) {
        chat.lastMessage = null;
      }
      res.send(chat);
    } else {
      // Create new chat room if none exists
      var chatData = {
        name: 'individual',
        type: 'individual',
        members: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'members',
        'name username avatar status'
      );
      res.status(200).json(fullChat);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch all chats for a user
// @route   GET /api/chats
// @access  Private
export const fetchChats = async (req, res, next) => {
  try {
    const blockedUsers = req.user.blockedUsers || [];
    const blockedUsersStr = blockedUsers.map(id => id.toString());

    let chats = await Chat.find({
      members: { $elemMatch: { $eq: req.user._id } },
      deletedFor: { $ne: req.user._id },
    })
      .populate('members', 'name username avatar status blockedUsers')
      .populate('groupAdmin', 'name username avatar status')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'lastMessage.sender',
      select: 'name username avatar email status',
    });

    // Filter out chats where the other user is blocked or has blocked us
    chats = chats.map(chat => {
      const chatObj = chat.toObject();
      
      if (chatObj.type === 'individual' && chatObj.members) {
        const otherMember = chatObj.members.find(m => m._id.toString() !== req.user._id.toString());
        if (otherMember) {
          const otherMemberIdStr = otherMember._id.toString();
          const isBlockedByMe = blockedUsersStr.includes(otherMemberIdStr);
          const hasBlockedMe = otherMember.blockedUsers && otherMember.blockedUsers.some(id => id.toString() === req.user._id.toString());
          if (isBlockedByMe || hasBlockedMe) {
            return null; // Hide this chat
          }
        }
      }

      if (chatObj.lastMessage && chatObj.lastMessage.deletedFor && 
          chatObj.lastMessage.deletedFor.some(id => id.toString() === req.user._id.toString())) {
        chatObj.lastMessage = null;
      }
      return chatObj;
    }).filter(Boolean);

    res.status(200).send(chats);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete chat for current user
// @route   DELETE /api/chats/:id
// @access  Private
export const deleteChatForUser = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findOne({
      _id: chatId,
      members: req.user._id,
    });

    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Instead of adding user to chat.deletedFor (which removes the chat from dashboard),
    // we soft-delete/clear all messages in the chat for this user.
    const Message = (await import('../models/Message.js')).default;
    await Message.updateMany(
      { chat: chatId, deletedFor: { $ne: req.user._id } },
      { $addToSet: { deletedFor: req.user._id } }
    );

    res.json({ message: 'Chat messages cleared successfully', chatId });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle mute chat for current user
// @route   PUT /api/chats/:id/mute
// @access  Private
export const toggleMuteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, members: req.user._id });
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    const isMuted = chat.mutedBy && chat.mutedBy.includes(req.user._id);
    if (isMuted) {
      chat.mutedBy = chat.mutedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      if (!chat.mutedBy) chat.mutedBy = [];
      chat.mutedBy.push(req.user._id);
    }
    await chat.save();
    res.json({ message: isMuted ? 'Chat unmuted' : 'Chat muted', muted: !isMuted });
  } catch (error) {
    next(error);
  }
};

// @desc    Perform bulk actions on chats (delete, mute, archive)
// @route   POST /api/chats/bulk
// @access  Private
export const bulkActionChats = async (req, res, next) => {
  const { chatIds, action } = req.body; // action: 'delete' | 'mute' | 'archive' | 'unmute'

  if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
    res.status(400);
    return next(new Error('No chat IDs provided'));
  }

  try {
    if (action === 'delete') {
      await Chat.updateMany(
        { _id: { $in: chatIds }, members: req.user._id },
        { $addToSet: { deletedFor: req.user._id } }
      );
    } else if (action === 'mute') {
      await Chat.updateMany(
        { _id: { $in: chatIds }, members: req.user._id },
        { $addToSet: { mutedBy: req.user._id } }
      );
    } else if (action === 'archive') {
      await Chat.updateMany(
        { _id: { $in: chatIds }, members: req.user._id },
        { $addToSet: { archivedBy: req.user._id } }
      );
    } else {
      res.status(400);
      throw new Error('Invalid bulk action');
    }

    res.json({ message: `Bulk action '${action}' completed successfully` });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Group Chat
// @route   POST /api/chats/group
// @access  Private
export const createGroupChat = async (req, res, next) => {
  const { users, name } = req.body;

  if (!users || !name) {
    res.status(400);
    return next(new Error('Please fill in all fields'));
  }

  // Parse users array if sent as string from frontend
  let parsedUsers = typeof users === 'string' ? JSON.parse(users) : users;

  if (parsedUsers.length < 2) {
    res.status(400);
    return next(new Error('More than 2 users are required to form a group chat'));
  }

  // Add the logged in user to the group members
  parsedUsers.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      name: name,
      type: 'group',
      members: parsedUsers,
      groupAdmin: req.user._id,
      avatar: req.body.avatar || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80',
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('members', '-password')
      .populate('lastMessage');

    // Notify other group members via Socket.io
    try {
      const { getIO } = await import('../config/socket.js');
      const io = getIO();
      parsedUsers.forEach((memberId) => {
        if (memberId.toString() !== req.user._id.toString()) {
          io.to(`user:${memberId.toString()}`).to(memberId.toString()).emit('added_to_group', {
            chatId: fullGroupChat._id,
            name: fullGroupChat.name,
            avatar: fullGroupChat.avatar,
            creatorName: req.user.name,
          });
        }
      });
    } catch (socketErr) {
      console.error('Failed to emit group invite socket event:', socketErr);
    }

    res.status(200).json(fullGroupChat);
  } catch (error) {
    next(error);
  }
};

// @desc    Rename Group Chat
// @route   PUT /api/chats/group/rename
// @access  Private
export const renameGroup = async (req, res, next) => {
  const { chatId, chatName } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    if (chat.type === 'group' && chat.groupAdmin && chat.groupAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the group administrator can perform this action');
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { name: chatName },
      { new: true }
    )
      .populate('members', 'name username avatar status')
      .populate('lastMessage');

    res.json(updatedChat);
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to group chat
// @route   PUT /api/chats/group/add
// @access  Private
export const addToGroup = async (req, res, next) => {
  const { chatId, userId } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Check if target user is already a member
    if (chat.members.includes(userId)) {
      res.status(400);
      throw new Error('User is already a member of this squad');
    }

    const isAdmin = chat.groupAdmin && chat.groupAdmin.toString() === req.user._id.toString();

    if (!isAdmin) {
      // Create a pending add request for the admin
      const Notification = (await import('../models/Notification.js')).default;
      const User = (await import('../models/User.js')).default;

      // Check if there is already a pending request
      const existingRequest = await Notification.findOne({
        receiver: chat.groupAdmin,
        type: 'group_add_request',
        relatedUser: userId,
        relatedChat: chatId
      });

      if (existingRequest) {
        return res.status(200).json({
          status: 'pending_approval',
          message: 'An addition request for this pilot is already pending admin approval.'
        });
      }

      const requester = await User.findById(req.user._id);
      const targetUser = await User.findById(userId);

      const notif = await Notification.create({
        sender: req.user._id,
        receiver: chat.groupAdmin,
        type: 'group_add_request',
        relatedUser: userId,
        relatedChat: chatId,
        message: `requested to add ${targetUser ? targetUser.name : 'a new pilot'} to "${chat.name}"`
      });

      const populatedNotif = await Notification.findById(notif._id)
        .populate('sender', 'name username avatar status')
        .populate('relatedUser', 'name username avatar status')
        .populate('relatedChat', 'name avatar type');

      // Send to Admin via Socket.io
      try {
        const { getIO } = await import('../config/socket.js');
        const io = getIO();
        io.to(`user:${chat.groupAdmin.toString()}`).to(chat.groupAdmin.toString()).emit('notification_received', populatedNotif);
      } catch (socketErr) {
        console.error('Failed to emit group add request socket event:', socketErr);
      }

      return res.status(200).json({
        status: 'pending_approval',
        message: 'Request sent to squad administrator for approval.'
      });
    }

    // Admin adds directly
    const added = await Chat.findByIdAndUpdate(
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
      io.to(`user:${userId}`).to(userId).emit('added_to_group', {
        chatId: added._id,
        name: added.name,
        avatar: added.avatar,
        creatorName: req.user.name,
      });
    } catch (socketErr) {
      console.error('Failed to emit group add socket event:', socketErr);
    }
    res.json(added);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group chat
// @route   PUT /api/chats/group/remove
// @access  Private
export const removeFromGroup = async (req, res, next) => {
  const { chatId, userId } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    // Enforce admin permission unless the user is leaving the group themselves
    if (chat.type === 'group' && chat.groupAdmin && chat.groupAdmin.toString() !== req.user._id.toString()) {
      if (userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Only the group administrator can perform this action');
      }
    }

    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { members: userId } },
      { new: true }
    )
      .populate('members', 'name username avatar status')
      .populate('lastMessage');

    res.json(removed);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin chat for current user
// @route   PUT /api/chats/:id/pin
// @access  Private
export const togglePinChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, members: req.user._id });
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    const isPinned = chat.pinnedBy && chat.pinnedBy.includes(req.user._id);
    if (isPinned) {
      chat.pinnedBy = chat.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      if (!chat.pinnedBy) chat.pinnedBy = [];
      chat.pinnedBy.push(req.user._id);
    }
    await chat.save();
    res.json({ message: isPinned ? 'Chat unpinned' : 'Chat pinned', pinned: !isPinned });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle archive chat for current user
// @route   PUT /api/chats/:id/archive
// @access  Private
export const toggleArchiveChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, members: req.user._id });
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found');
    }

    const isArchived = chat.archivedBy && chat.archivedBy.includes(req.user._id);
    if (isArchived) {
      chat.archivedBy = chat.archivedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      if (!chat.archivedBy) chat.archivedBy = [];
      chat.archivedBy.push(req.user._id);
    }
    await chat.save();
    res.json({ message: isArchived ? 'Chat unarchived' : 'Chat archived', archived: !isArchived });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Shared Media for a specific chat
// @route   GET /api/chats/:id/media
// @access  Private
export const getChatMedia = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    // Verify user is member of chat
    const chat = await Chat.findOne({ _id: chatId, members: req.user._id });
    if (!chat) {
      res.status(404);
      throw new Error('Chat not found or access denied');
    }

    const Message = (await import('../models/Message.js')).default;

    const messages = await Message.find({
      chat: chatId,
      mediaUrl: { $ne: '' },
      deletedFor: { $ne: req.user._id }
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name username avatar');

    const mediaList = { images: [], videos: [], files: [] };

    messages.forEach(msg => {
      const item = {
        id: msg._id,
        url: msg.mediaUrl,
        name: msg.text || msg.mediaUrl.split('/').pop(),
        sender: msg.sender,
        createdAt: msg.createdAt
      };

      if (msg.mediaType === 'image') {
        mediaList.images.push(item);
      } else if (msg.mediaType === 'video') {
        mediaList.videos.push({
          ...item,
          title: item.name,
          thumbnail: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&auto=format&fit=crop&q=80',
          duration: '0:30'
        });
      } else if (msg.mediaType === 'file' || msg.mediaType === 'document') {
        mediaList.files.push({
          ...item,
          size: 'Shared File',
          type: 'Document'
        });
      }
    });

    res.json(mediaList);
  } catch (error) {
    next(error);
  }
};
