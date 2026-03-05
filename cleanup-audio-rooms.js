// Script to clean up audio room messages - keep only last 100 messages per room
// Usage: 
// Option 1: Set MONGODB_URI environment variable first
//   $env:MONGODB_URI="your-mongodb-connection-string"
//   node cleanup-audio-rooms.js
// Option 2: Pass URI as argument
//   node cleanup-audio-rooms.js "your-mongodb-connection-string"

const mongoose = require('mongoose');

// Get MongoDB URI from argument or environment
const MONGODB_URI = process.argv[2] || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found!');
  console.error('\nPlease provide MongoDB URI in one of these ways:');
  console.error('1. Pass as argument: node cleanup-audio-rooms.js "mongodb://..."');
  console.error('2. Set environment variable: $env:MONGODB_URI="mongodb://..."');
  process.exit(1);
}

const audioRoomSchema = new mongoose.Schema({
  name: String,
  description: String,
  roomCode: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isPrivate: Boolean,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  maxParticipants: Number,
  messages: [{ type: mongoose.Schema.Types.Mixed }],
  playHistory: [{ type: mongoose.Schema.Types.Mixed }],
  nowPlaying: { type: mongoose.Schema.Types.Mixed },
  queue: [{ type: mongoose.Schema.Types.Mixed }],
  isActive: Boolean,
  createdAt: Date,
  lastActivity: Date
});

const AudioRoom = mongoose.models.AudioRoom || mongoose.model("AudioRoom", audioRoomSchema);

async function cleanupAudioRooms() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Find all audio rooms
    const rooms = await AudioRoom.find({}).lean();
    console.log(`Found ${rooms.length} total audio rooms`);

    let updatedCount = 0;
    let totalMessagesSaved = 0;
    let totalHistorySaved = 0;

    for (const room of rooms) {
      let needsUpdate = false;
      const updates = {};

      // Trim messages
      if (room.messages && room.messages.length > 100) {
        const originalCount = room.messages.length;
        updates.messages = room.messages.slice(-100);
        totalMessagesSaved += (originalCount - 100);
        needsUpdate = true;
        console.log(`Room ${room._id} (${room.name}): Messages ${originalCount} → 100`);
      }

      // Trim play history
      if (room.playHistory && room.playHistory.length > 50) {
        const originalCount = room.playHistory.length;
        updates.playHistory = room.playHistory.slice(-50);
        totalHistorySaved += (originalCount - 50);
        needsUpdate = true;
        console.log(`Room ${room._id} (${room.name}): Play history ${originalCount} → 50`);
      }

      if (needsUpdate) {
        await AudioRoom.updateOne({ _id: room._id }, { $set: updates });
        updatedCount++;
      }
    }

    console.log('\n=== Cleanup Complete ===');
    console.log(`Rooms updated: ${updatedCount}`);
    console.log(`Total messages removed: ${totalMessagesSaved}`);
    console.log(`Total play history removed: ${totalHistorySaved}`);
    console.log('========================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupAudioRooms();
