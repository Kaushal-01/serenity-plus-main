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

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: { type: [favoriteSchema], default: [] },
   preferences: {
    genres: [String],
    artists: [String],
    isSetupComplete: { type: Boolean, default: false }
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
