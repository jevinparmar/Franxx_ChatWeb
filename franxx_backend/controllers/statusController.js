import Status from '../models/Status.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

// @desc    Create a status update (story)
// @route   POST /api/status
// @access  Private
export const createStatus = async (req, res, next) => {
  const { mediaUrl, mediaType, caption } = req.body;

  if (!mediaUrl) {
    res.status(400);
    return next(new Error('Media URL is required for status updates'));
  }

  try {
    const status = await Status.create({
      user: req.user._id,
      mediaUrl,
      mediaType: mediaType || 'image',
      caption: caption || '',
      viewers: [],
    });

    const populatedStatus = await status.populate('user', 'name username avatar status');

    res.status(201).json(populatedStatus);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active status updates
// @route   GET /api/status
// @access  Private
export const getAllStatuses = async (req, res, next) => {
  try {
    // 1. Fetch user's chats to include active contact squads
    const chats = await Chat.find({ members: req.user._id }).select('members');
    const chatMemberIds = chats.flatMap(chat => chat.members.map(m => m.toString()));

    // 2. Combine logged-in user, followed users, and active chat squad contacts
    const allowedUserIds = Array.from(new Set([
      req.user._id.toString(),
      ...req.user.following.map(id => id.toString()),
      ...chatMemberIds
    ]));

    // Enforce private visibility constraints
    const usersInfo = await User.find({ _id: { $in: allowedUserIds } })
      .select('isPrivate followers')
      .lean();

    const verifiedUserIds = allowedUserIds.filter(id => {
      if (id === req.user._id.toString()) return true;
      const uInfo = usersInfo.find(u => u._id.toString() === id);
      if (!uInfo) return false;
      if (uInfo.isPrivate) {
        // Must be followed by the current user
        return uInfo.followers && uInfo.followers.some(fId => fId.toString() === req.user._id.toString());
      }
      return true;
    });

    // 3. Retrieve only active status updates (created within the last 24h)
    const activeTimeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const statuses = await Status.find({
      user: { $in: verifiedUserIds },
      createdAt: { $gte: activeTimeThreshold }
    })
      .populate('user', 'name username avatar status')
      .populate('viewers', 'name username avatar status')
      .sort({ createdAt: -1 });

    // Format output: group stories by user for frontend convenience
    const groupedStatuses = statuses.reduce((acc, current) => {
      const userId = current.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: current.user,
          stories: [],
        };
      }
      acc[userId].stories.push({
        _id: current._id,
        mediaUrl: current.mediaUrl,
        mediaType: current.mediaType,
        caption: current.caption,
        createdAt: current.createdAt,
        viewers: current.viewers || [],
      });
      return acc;
    }, {});

    res.status(200).json(Object.values(groupedStatuses));
  } catch (error) {
    next(error);
  }
};

// @desc    Record a status viewer entry
// @route   PUT /api/status/:id/view
// @access  Private
export const viewStatus = async (req, res, next) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) {
      res.status(404);
      throw new Error('Status not found');
    }

    // Do not record view if it's the owner's own slide
    if (status.user.toString() !== req.user._id.toString()) {
      if (!status.viewers) status.viewers = [];
      const currentUserIdStr = req.user._id.toString();
      if (!status.viewers.some(v => v.toString() === currentUserIdStr)) {
        status.viewers.push(req.user._id);
        await status.save();
      }
    }

    res.json({ message: 'Status view recorded', viewers: status.viewers });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a status slide
// @route   DELETE /api/status/:id
// @access  Private
export const deleteStatus = async (req, res, next) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) {
      res.status(404);
      throw new Error('Status not found');
    }

    if (status.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the owner can delete this status update');
    }

    await status.deleteOne();
    res.json({ message: 'Status update deleted successfully' });
  } catch (error) {
    next(error);
  }
};
