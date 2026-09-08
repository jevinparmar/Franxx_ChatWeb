import mongoose from 'mongoose';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Status from '../models/Status.js';
import SearchHistory from '../models/SearchHistory.js';
import Notification from '../models/Notification.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-create collections if they don't already exist
    await Promise.all([
      User.createCollection(),
      Chat.createCollection(),
      Message.createCollection(),
      Status.createCollection(),
      SearchHistory.createCollection(),
      Notification.createCollection(),
    ]);
    console.log('Database collections initialized and verified.');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
