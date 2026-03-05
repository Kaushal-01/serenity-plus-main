# MongoDB Schemas and Indexes

This document describes the MongoDB collections and required indexes for the realtime server.

## Collections

### 1. users
Stores user information and friends list.

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String, // hashed
  profilePicture: String,
  friends: [String], // Array of user IDs
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ friends: 1 }); // For presence queries
```

### 2. chats
Stores 1-1 chat metadata.

```javascript
{
  _id: ObjectId,
  participants: [String], // Array of 2 user IDs (sorted)
  createdAt: Date,
  lastMessageAt: Date
}
```

**Indexes:**
```javascript
db.chats.createIndex({ participants: 1 }, { unique: true });
db.chats.createIndex({ lastMessageAt: -1 });
```

### 3. messages
Stores individual chat messages.

```javascript
{
  _id: ObjectId,
  chatId: String, // Reference to chat
  sender: String, // User ID
  receiver: String, // User ID
  content: String,
  createdAt: Date,
  read: Boolean
}
```

**Indexes:**
```javascript
db.messages.createIndex({ chatId: 1, createdAt: -1 }); // For message history
db.messages.createIndex({ sender: 1, receiver: 1 });
db.messages.createIndex({ receiver: 1, read: 1 }); // For unread count
```

### 4. rooms
Stores text room metadata (public/private).

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  type: String, // 'text', 'audio'
  isPublic: Boolean,
  members: [String], // User IDs (for private rooms)
  createdBy: String, // User ID
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.rooms.createIndex({ type: 1, isPublic: 1 });
db.rooms.createIndex({ members: 1 });
db.rooms.createIndex({ createdBy: 1 });
```

### 5. roommessages
Stores room messages.

```javascript
{
  _id: ObjectId,
  roomId: String, // Room ID
  sender: {
    _id: String,
    username: String,
    profilePicture: String
  },
  content: String,
  createdAt: Date
}
```

**Indexes:**
```javascript
db.roommessages.createIndex({ roomId: 1, createdAt: -1 }); // For message history
```

### 6. audiorooms
Stores audio room metadata and participants.

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  isPrivate: Boolean,
  members: [String], // User IDs (for private rooms)
  participants: [String], // Currently active user IDs
  createdBy: String, // User ID
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.audiorooms.createIndex({ isPrivate: 1 });
db.audiorooms.createIndex({ participants: 1 });
db.audiorooms.createIndex({ createdBy: 1 });
```

## Redis Data Structures

### Presence
**Key:** `presence:{userId}`  
**Type:** Set  
**Value:** Socket IDs  
**TTL:** 300 seconds (5 minutes)

### Audio Room State
**Key:** `audio_room:{roomId}`  
**Type:** String (JSON)  
**Value:**
```json
{
  "roomId": "string",
  "currentTrackId": "string | null",
  "playbackPosition": 0,
  "isPlaying": false,
  "playedBy": "string | null",
  "timestamp": 1234567890,
  "currentTrack": {
    "id": "string",
    "title": "string",
    "artist": "string",
    "albumArt": "string",
    "duration": 0
  }
}
```
**TTL:** 3600 seconds (1 hour)

## Index Creation Script

Run this script to create all required indexes:

```javascript
// MongoDB Shell Script
use serenity;

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ friends: 1 });

// Chats indexes
db.chats.createIndex({ participants: 1 }, { unique: true });
db.chats.createIndex({ lastMessageAt: -1 });

// Messages indexes
db.messages.createIndex({ chatId: 1, createdAt: -1 });
db.messages.createIndex({ sender: 1, receiver: 1 });
db.messages.createIndex({ receiver: 1, read: 1 });

// Rooms indexes
db.rooms.createIndex({ type: 1, isPublic: 1 });
db.rooms.createIndex({ members: 1 });
db.rooms.createIndex({ createdBy: 1 });

// Room messages indexes
db.roommessages.createIndex({ roomId: 1, createdAt: -1 });

// Audio rooms indexes
db.audiorooms.createIndex({ isPrivate: 1 });
db.audiorooms.createIndex({ participants: 1 });
db.audiorooms.createIndex({ createdBy: 1 });

print("All indexes created successfully!");
```

## Migration Notes

1. **Existing Data**: If you have existing data, run the index creation script before deploying the realtime server.

2. **ChatId Format**: The realtime server uses `chatId` as a string reference. Ensure your existing data follows this format.

3. **Participants Array**: For chats, the participants array should always be sorted to ensure uniqueness.

4. **Friends Array**: Make sure the users collection has a `friends` field (array of user IDs).

5. **Audio Rooms**: If you don't have an `audiorooms` collection yet, create it before using audio room features.
