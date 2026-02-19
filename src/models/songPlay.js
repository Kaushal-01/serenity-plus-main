import mongoose from "mongoose";

const songPlaySchema = new mongoose.Schema({
  songId: { type: String, required: true, index: true },
  songName: { type: String, required: true },
  artists: { type: Array, default: [] },
  primaryArtists: { type: String },
  image: { type: Array, default: [] },
  downloadUrl: { type: Array, default: [] },
  url: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  playedAt: { type: Date, default: Date.now, index: true }
});

// Compound index for efficient trending queries
songPlaySchema.index({ songId: 1, playedAt: -1 });

export default mongoose.models.SongPlay || mongoose.model("SongPlay", songPlaySchema);
