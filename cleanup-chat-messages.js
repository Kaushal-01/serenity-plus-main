// Script to clean up chat messages - keep only last 200 messages per chat
// Usage: 
// Option 1: Set MONGODB_URI environment variable first
//   $env:MONGODB_URI="your-mongodb-connection-string"
//   node cleanup-chat-messages.js
// Option 2: Pass URI as argument
//   node cleanup-chat-messages.js "your-mongodb-connection-string"

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Get MongoDB URI from argument or environment
const MONGODB_URI = process.argv[2] || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found!');
  console.error('\nPlease provide MongoDB URI in one of these ways:');
  console.error('1. Pass as argument: node cleanup-chat-messages.js "mongodb://..."');
  console.error('2. Set environment variable: $env:MONGODB_URI="mongodb://..."');
  process.exit(1);
}

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [{ type: mongoose.Schema.Types.Mixed }],
  lastMessage: Date,
  createdAt: Date,
  clearedBy: [{ type: mongoose.Schema.Types.Mixed }]
});

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

async function cleanupChatMessages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Find all chats with more than 200 messages
    const chats = await Chat.find({}).lean();
    console.log(`Found ${chats.length} total chats`);

    let updatedCount = 0;
    let totalMessagesSaved = 0;

    for (const chat of chats) {
      if (chat.messages && chat.messages.length > 200) {
        const originalCount = chat.messages.length;
        const newMessages = chat.messages.slice(-200);
        
        await Chat.updateOne(
          { _id: chat._id },
          { $set: { messages: newMessages } }
        );
        
        updatedCount++;
        totalMessagesSaved += (originalCount - 200);
        console.log(`Chat ${chat._id}: Trimmed ${originalCount} → 200 messages`);
      }
    }

    console.log('\n=== Cleanup Complete ===');
    console.log(`Chats updated: ${updatedCount}`);
    console.log(`Total messages removed: ${totalMessagesSaved}`);
    console.log('========================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupChatMessages();
