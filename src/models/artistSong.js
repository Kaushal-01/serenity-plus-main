import mongoose from "mongoose";

const artistSongSchema = new mongoose.Schema({
  songName: { type: String, required: true },
  artistName: { type: String, required: true },
  musicBy: { type: String, required: true },
  coverPhoto: { type: String, required: true },
  audioFile: { type: String, required: true },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  duration: { type: Number }, // in seconds
  genre: { type: String },
  description: { type: String },
  // Listener tracking
  totalPlays: { type: Number, default: 0 },
  uniqueListeners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  uploadedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Index for efficient search
artistSongSchema.index({ songName: 'text', artistName: 'text', musicBy: 'text' });
artistSongSchema.index({ uploadedBy: 1 });

export default mongoose.models.ArtistSong || mongoose.model("ArtistSong", artistSongSchema);
