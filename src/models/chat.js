import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  messageType: { 
    type: String, 
    enum: ["text", "playlist", "song"], 
    default: "text" 
  },
  // For shared content
  sharedContent: {
    type: { type: String, enum: ["playlist", "song", "artistSong"] },
    id: { type: String },
    name: { type: String },
    image: { type: String },
    data: { type: mongoose.Schema.Types.Mixed }
  },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
}, { _id: true });

const chatSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }],
  messages: [messageSchema],
  lastMessage: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  // Track when each user cleared their chat view
  clearedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clearedAt: { type: Date, default: Date.now }
  }]
});

// Index for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessage: -1 });

// Pre-save hook to limit messages array size (prevent document bloat)
chatSchema.pre('save', function() {
  // Keep only last 200 messages to prevent huge documents
  if (this.messages && this.messages.length > 200) {
    this.messages = this.messages.slice(-200);
  }
});

export default mongoose.models.Chat || mongoose.model("Chat", chatSchema);
