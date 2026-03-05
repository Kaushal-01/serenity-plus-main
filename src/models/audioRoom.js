import mongoose from "mongoose";

// Generate a unique 6-character room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const roomMessageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  senderName: { type: String },
  senderProfilePicture: { type: String },
  content: { 
    type: String, 
    maxlength: 500
  },
  messageType: { 
    type: String, 
    enum: ["text", "song", "emoji"], 
    default: "text" 
  },
  // For shared songs
  sharedSong: {
    id: { type: String },
    name: { type: String },
    artists: { type: String },
    image: { type: String },
    downloadUrl: { type: Array }
  },
  // For emojis
  emoji: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const songVoteSchema = new mongoose.Schema({
  songId: { type: String, required: true },
  songName: { type: String },
  artists: { type: String },
  image: { type: String },
  downloadUrl: { type: Array },
  voters: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  voteCount: { type: Number, default: 0 },
  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const nowPlayingSchema = new mongoose.Schema({
  songId: { type: String },
  songName: { type: String },
  artists: { type: String },
  image: { type: String },
  downloadUrl: { type: Array },
  duration: { type: Number }, // in seconds
  startedAt: { type: Date },
  playedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, { _id: false });

const audioRoomSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    maxlength: 50 
  },
  description: { 
    type: String, 
    maxlength: 200 
  },
  roomCode: { 
    type: String, 
    required: true, 
    unique: true,
    default: generateRoomCode 
  },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  isPrivate: { 
    type: Boolean, 
    default: false 
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  maxParticipants: { 
    type: Number, 
    default: 25,
    max: 25 
  },
  messages: [roomMessageSchema],
  nowPlaying: nowPlayingSchema,
  queue: [songVoteSchema],
  playHistory: [{
    songId: { type: String },
    songName: { type: String },
    playedAt: { type: Date },
    playedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for efficient queries
// Note: roomCode index is created by unique: true in schema, no need to duplicate
audioRoomSchema.index({ creator: 1 });
audioRoomSchema.index({ isPrivate: 1, isActive: 1 });
audioRoomSchema.index({ lastActivity: -1 });
audioRoomSchema.index({ participants: 1 });

// Method to add participant
audioRoomSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId) && 
      this.participants.length < this.maxParticipants) {
    this.participants.push(userId);
    this.lastActivity = new Date();
    return true;
  }
  return false;
};

// Method to remove participant
audioRoomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    id => id.toString() !== userId.toString()
  );
  this.lastActivity = new Date();
};

// Method to add message
audioRoomSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  // Keep only last 200 messages to avoid document size issues
  if (this.messages.length > 200) {
    this.messages = this.messages.slice(-200);
  }
  this.lastActivity = new Date();
};

// Method to vote for a song
audioRoomSchema.methods.voteSong = function(userId, songData) {
  const existingVote = this.queue.find(
    vote => vote.songId === songData.songId
  );
  
  if (existingVote) {
    if (!existingVote.voters.includes(userId)) {
      existingVote.voters.push(userId);
      existingVote.voteCount += 1;
    }
  } else {
    this.queue.push({
      ...songData,
      voters: [userId],
      voteCount: 1,
      requestedBy: userId
    });
  }
  
  // Sort queue by vote count
  this.queue.sort((a, b) => b.voteCount - a.voteCount);
  this.lastActivity = new Date();
};

// Method to play next song from queue
audioRoomSchema.methods.playNextSong = function(userId) {
  if (this.queue.length === 0) {
    this.nowPlaying = null;
    return null;
  }
  
  const nextSong = this.queue[0];
  
  // Add to history
  if (this.nowPlaying && this.nowPlaying.songId) {
    this.playHistory.push({
      songId: this.nowPlaying.songId,
      songName: this.nowPlaying.songName,
      playedAt: new Date(),
      playedBy: this.nowPlaying.playedBy
    });
    
    // Keep only last 50 in history
    if (this.playHistory.length > 50) {
      this.playHistory = this.playHistory.slice(-50);
    }
  }
  
  // Set now playing
  this.nowPlaying = {
    songId: nextSong.songId,
    songName: nextSong.songName,
    artists: nextSong.artists,
    image: nextSong.image,
    downloadUrl: nextSong.downloadUrl,
    duration: nextSong.duration || 180,
    startedAt: new Date(),
    playedBy: userId
  };
  
  // Remove from queue
  this.queue.shift();
  this.lastActivity = new Date();
  
  return this.nowPlaying;
};

// Clear the cached model to ensure we use the fresh schema
if (mongoose.models.AudioRoom) {
  delete mongoose.models.AudioRoom;
}

export default mongoose.model("AudioRoom", audioRoomSchema);
