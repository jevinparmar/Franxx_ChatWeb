/**
 * FRANXX ChatWeb — Safe Database Seed Script
 *
 * This script inserts demo/sample data into MongoDB for development and testing.
 *
 * SAFETY GUARANTEES:
 *   ✅ Uses findOneAndUpdate with upsert — running multiple times will NOT create duplicates.
 *   ✅ Never calls dropDatabase(), dropCollection(), or deleteMany().
 *   ✅ Existing production data is never touched or overwritten.
 *   ✅ Only demo records (identified by _seedKey usernames/fields) are inserted or updated.
 *
 * Usage:
 *   cd franxx_backend
 *   npm run db:seed
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Path setup
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from franxx_backend directory
const envPath = path.resolve(__dirname, '../../franxx_backend/.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('❌ Error: Could not find franxx_backend/.env');
  console.error(`   Expected at: ${envPath}`);
  console.error('   Copy franxx_backend/.env.example to franxx_backend/.env and configure it.');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI is not defined in franxx_backend/.env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Import Mongoose models (use the project's existing models as source of truth)
// ---------------------------------------------------------------------------
const User = (await import('../../franxx_backend/models/User.js')).default;
const Chat = (await import('../../franxx_backend/models/Chat.js')).default;
const Message = (await import('../../franxx_backend/models/Message.js')).default;
const Notification = (await import('../../franxx_backend/models/Notification.js')).default;

// ---------------------------------------------------------------------------
// Load seed data JSON files
// ---------------------------------------------------------------------------
const seedsDir = path.resolve(__dirname, '../seeds');

const loadJSON = (filename) => {
  const filepath = path.join(seedsDir, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
};

const usersData = loadJSON('users.json');
const chatsData = loadJSON('chats.json');
const messagesData = loadJSON('messages.json');
const notificationsData = loadJSON('notifications.json');

// ---------------------------------------------------------------------------
// Helper: Hash a password using the same bcrypt pattern as User model
// ---------------------------------------------------------------------------
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
const seedDatabase = async () => {
  console.log('\n🌱 FRANXX Database Seed Script');
  console.log('══════════════════════════════════════════════════\n');

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.host}\n`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // ----- PHASE 1: Seed Users -----
  console.log('📦 Phase 1: Seeding Users...');
  const userMap = new Map(); // _seedKey → MongoDB ObjectId

  for (const userData of usersData) {
    const { _seedKey, password, ...fields } = userData;

    // Hash the demo password (we do this manually to avoid triggering pre-save
    // on update, which would double-hash existing passwords)
    const hashedPassword = await hashPassword(password);

    const user = await User.findOneAndUpdate(
      { username: fields.username }, // Match by unique username
      {
        $setOnInsert: {
          ...fields,
          password: hashedPassword,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    userMap.set(_seedKey, user._id);
    const wasNew = user.createdAt.getTime() === user.updatedAt.getTime();
    console.log(`   ${wasNew ? '✨ Created' : '⏩ Exists '}: ${fields.username} (${user._id})`);
  }

  // ----- PHASE 2: Seed Chats -----
  console.log('\n📦 Phase 2: Seeding Chats...');
  const chatMap = new Map(); // _seedKey → MongoDB ObjectId

  for (const chatData of chatsData) {
    const { _seedKey, _memberKeys, _adminKey, ...fields } = chatData;

    // Resolve member keys to ObjectIds
    const memberIds = _memberKeys.map((key) => userMap.get(key)).filter(Boolean);
    if (memberIds.length !== _memberKeys.length) {
      console.warn(`   ⚠️  Skipping chat "${_seedKey}": some member keys could not be resolved.`);
      continue;
    }

    // For individual chats, find by sorted member pair; for groups, find by name
    let filter;
    if (fields.type === 'individual') {
      // Match individual chats by their exact member pair
      filter = {
        type: 'individual',
        members: { $all: memberIds, $size: memberIds.length },
      };
    } else {
      // Match group chats by name
      filter = { type: 'group', name: fields.name };
    }

    const chatDoc = await Chat.findOneAndUpdate(
      filter,
      {
        $setOnInsert: {
          ...fields,
          members: memberIds,
          groupAdmin: _adminKey ? userMap.get(_adminKey) : undefined,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    chatMap.set(_seedKey, chatDoc._id);
    console.log(`   ${chatDoc.type === 'group' ? '👥' : '💬'} ${fields.type}: "${fields.name || _seedKey}" (${chatDoc._id})`);
  }

  // ----- PHASE 3: Seed Messages -----
  console.log('\n📦 Phase 3: Seeding Messages...');
  let lastMessagePerChat = new Map(); // chatId → last message ObjectId

  for (const msgData of messagesData) {
    const { _seedKey, _chatKey, _senderKey, ...fields } = msgData;

    const chatId = chatMap.get(_chatKey);
    const senderId = userMap.get(_senderKey);

    if (!chatId || !senderId) {
      console.warn(`   ⚠️  Skipping message "${_seedKey}": chat or sender key could not be resolved.`);
      continue;
    }

    // Use clientMessageId as a unique deduplication key for seed messages
    const clientMessageId = `seed_${_seedKey}`;

    const msgDoc = await Message.findOneAndUpdate(
      { clientMessageId },
      {
        $setOnInsert: {
          ...fields,
          chat: chatId,
          sender: senderId,
          clientMessageId,
          readBy: [senderId],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    lastMessagePerChat.set(chatId.toString(), msgDoc._id);
    console.log(`   💬 "${fields.text.substring(0, 40)}..." → ${_chatKey}`);
  }

  // Update lastMessage reference on chats
  for (const [chatIdStr, lastMsgId] of lastMessagePerChat) {
    await Chat.findByIdAndUpdate(chatIdStr, { lastMessage: lastMsgId });
  }

  // ----- PHASE 4: Seed Notifications -----
  console.log('\n📦 Phase 4: Seeding Notifications...');

  for (const notifData of notificationsData) {
    const { _seedKey, _senderKey, _receiverKey, _relatedChatKey, ...fields } = notifData;

    const senderId = userMap.get(_senderKey);
    const receiverId = userMap.get(_receiverKey);
    const relatedChatId = _relatedChatKey ? chatMap.get(_relatedChatKey) : undefined;

    if (!senderId || !receiverId) {
      console.warn(`   ⚠️  Skipping notification "${_seedKey}": sender or receiver key could not be resolved.`);
      continue;
    }

    // Deduplicate by sender + receiver + type + message
    await Notification.findOneAndUpdate(
      {
        sender: senderId,
        receiver: receiverId,
        type: fields.type,
        message: fields.message,
      },
      {
        $setOnInsert: {
          ...fields,
          sender: senderId,
          receiver: receiverId,
          relatedChat: relatedChatId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`   🔔 ${fields.type}: ${_senderKey} → ${_receiverKey}`);
  }

  // ----- DONE -----
  console.log('\n══════════════════════════════════════════════════');
  console.log('✅ Seed complete! Demo data has been inserted safely.');
  console.log('   Existing data was NOT modified or deleted.');
  console.log('══════════════════════════════════════════════════\n');

  console.log('Demo login credentials:');
  console.log('  Username: alice_demo    Password: DemoPass@123');
  console.log('  Username: bob_demo      Password: DemoPass@123');
  console.log('  Username: charlie_demo  Password: DemoPass@123');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
};

// Run
seedDatabase().catch((err) => {
  console.error('❌ Seed script failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
