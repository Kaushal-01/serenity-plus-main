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
// Compound index for efficient user listening history queries
songPlaySchema.index({ userId: 1, playedAt: -1 });
// Index for time-based queries (trending in last 30 days, etc.)
songPlaySchema.index({ playedAt: -1 });

export default mongoose.models.SongPlay || mongoose.model("SongPlay", songPlaySchema);
