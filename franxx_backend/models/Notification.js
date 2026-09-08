import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['friend_request', 'follow_request', 'request_accepted', 'follow_accept', 'message', 'group_invite', 'mention', 'system', 'group_add_request'],
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user notifications fast
notificationSchema.index({ receiver: 1, createdAt: -1 });
notificationSchema.index({ receiver: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
