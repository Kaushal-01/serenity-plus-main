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
  favorites: { type: [favoriteSchema], default: [] },
  playlists: { type: [playlistSchema], default: [] },
   preferences: {
    genres: [String],
    artists: [String],
    isSetupComplete: { type: Boolean, default: false }
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
