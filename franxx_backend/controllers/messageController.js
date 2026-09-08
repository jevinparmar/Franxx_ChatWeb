import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';


// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  const { chatId, text, mediaUrl, mediaType, clientMessageId } = req.body;

  if (!chatId || (!text && !mediaUrl)) {
    res.status(400);
    return next(new Error('Invalid message payload'));
  }

  try {
    // Validate user belongs to chat
    const chat = await Chat.findOne({ _id: chatId, members: req.user._id });
    if (!chat) {
      res.status(403);
      return next(new Error('Not authorized to send message in this chat'));
    }

    if (chat.type === 'individual') {
      const otherMemberId = chat.members.find(m => m.toString() !== req.user._id.toString());
      if (otherMemberId) {
        const otherUser = await User.findById(otherMemberId);
        if (otherUser && otherUser.blockedUsers && otherUser.blockedUsers.includes(req.user._id)) {
          res.status(403);
          return next(new Error('Cannot send messages to a user who has blocked you'));
        }
        const currentUser = await User.findById(req.user._id);
        if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.includes(otherMemberId)) {
          res.status(403);
          return next(new Error('Cannot send messages to a blocked user'));
        }
      }
    }

    let newMessageData = {
      chat: chatId,
      sender: req.user._id, // Strict authentication check using req.user._id
      clientMessageId: clientMessageId || null,
      text: text || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || 'none',
      readBy: [req.user._id],
      status: 'sent',
    };

    let message = await Message.create(newMessageData);

    // Lean lean populate for high performance
    message = await Message.findById(message._id)
      .populate('sender', 'name username avatar status')
      .populate({
        path: 'chat',
        select: 'name type members avatar',
        populate: {
          path: 'members',
          select: 'name username avatar email status',
        },
      });

    // Update the Chat with the last message and restore sidebar visibility for all members
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      updatedAt: new Date(),
      $set: { deletedFor: [] },
    });

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a specific chat room with pagination & lean selection
// @route   GET /api/messages/:chatId
// @access  Private
export const allMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;
    const before = req.query.before; // createdAt ISO string or timestamp

    // Ensure user belongs to chat
    const chat = await Chat.findOne({ _id: chatId, members: req.user._id });
    if (!chat) {
      res.status(403);
      return next(new Error('Not authorized to access messages for this chat'));
    }

    const query = {
      chat: chatId,
      deletedFor: { $ne: req.user._id },
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const rawMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name username avatar status')
      .lean();

    // Reverse to return in chronological order (oldest to newest)
    const messages = rawMessages.reverse().map(msg => {
      if (msg.isDeletedForEveryone) {
        msg.text = 'This message was deleted';
        msg.mediaUrl = '';
        msg.mediaType = 'none';
      }
      return msg;
    });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all messages in a chat as read by current user
// @route   PATCH /api/messages/read/:chatId
// @access  Private
export const markChatMessagesRead = async (req, res, next) => {
  try {
    const chatId = req.params.chatId;
    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id }, $set: { status: 'seen' } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete message (for me OR for everyone)
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res, next) => {
  const { forEveryone } = req.query; // ?forEveryone=true

  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Ensure the message belongs to a chat the user is a member of
    const chat = await Chat.findOne({ _id: message.chat, members: req.user._id });
    if (!chat) {
      res.status(403);
      throw new Error('Not authorized to access this message');
    }

    if (forEveryone === 'true') {
      // Only sender can delete for everyone
      if (message.sender.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Only the sender can delete this message for everyone');
      }
      message.isDeletedForEveryone = true;
      await message.save();

      // Emit socket event to notify other chat members in real-time
      try {
        const { getIO } = await import('../config/socket.js');
        const io = getIO();
        io.to(message.chat.toString()).emit('message_deleted_for_everyone', {
          chatId: message.chat,
          messageId: message._id
        });
      } catch (socketErr) {
        console.error('Failed to emit delete message socket event:', socketErr);
      }
    } else {
      // Delete for me
      if (!message.deletedFor) message.deletedFor = [];
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    }

    res.json({ message: 'Message deleted successfully', messageId: message._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all media shared across all chats for a user
// @route   GET /api/messages/shared/media
// @access  Private
export const getSharedMedia = async (req, res, next) => {
  try {
    const userChats = await Chat.find({ members: req.user._id }).select('_id');
    const chatIds = userChats.map(c => c._id);

    const messages = await Message.find({
      chat: { $in: chatIds },
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
