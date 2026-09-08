import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'text'],
      default: 'image',
    },
    caption: {
      type: String,
      default: '',
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // Automagically delete documents after 24 hours
    },
  }
);

const Status = mongoose.model('Status', statusSchema);
export default Status;
