import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      trim: true,
      default: '',
    },
    searchedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ user: 1, updatedAt: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
export default SearchHistory;
