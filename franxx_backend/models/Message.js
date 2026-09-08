import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientMessageId: {
      type: String,
      default: null,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'file', 'audio', 'none'],
      default: 'none',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'seen', 'failed'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high-performance paginated message retrieval
messageSchema.index({ chat: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
