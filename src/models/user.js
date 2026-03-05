import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: String,
  artists: Array,
  image: Array,
  downloadUrl: Array,
  url: String,
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const songSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: String,
  artists: Array,
  primaryArtists: String,
  image: Array,
  downloadUrl: Array,
  url: String,
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  songs: { type: [songSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String },
  ageGroup: { type: String },
  occupation: { type: String },
  listeningHabits: { type: String },
  favorites: { type: [favoriteSchema], default: [] },
  playlists: { type: [playlistSchema], default: [] },
  preferences: {
    genres: [String],
    artists: [String],
    isSetupComplete: { type: Boolean, default: false }
  },
  // Social Features
  userId: { 
    type: String, 
    unique: true, 
    sparse: true // Allow null initially
  },
  userIdLastChanged: { type: Date },
  profilePicture: { type: String, default: "" },
  accountType: { 
    type: String, 
    enum: ["public", "private", "artist"], 
    default: "public" 
  },
  bio: { type: String, default: "" },
  favoriteArtists: { type: [String], default: [] },
  favoriteGenres: { type: [String], default: [] },
  // Friends system
  friends: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now }
  }],
  sentFriendRequests: [{
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now }
  }],
  // Blocked users
  blockedUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  // Artist specific fields
  artistName: { type: String },
  artistVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance and uniqueness
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userId: 1 }, { unique: true, sparse: true });
userSchema.index({ name: 1 });
userSchema.index({ userId: 1, name: 1 }); // Compound index for search
userSchema.index({ friends: 1 }); // Index for friend queries
userSchema.index({ "friendRequests.from": 1 }); // Index for incoming requests
userSchema.index({ "sentFriendRequests.to": 1 }); // Index for outgoing requests

export default mongoose.models.User || mongoose.model("User", userSchema);
