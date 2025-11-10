import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const emotionalContextSchema = new mongoose.Schema({
  mood: { type: String }, // happy, sad, anxious, calm, stressed, etc.
  emotionalState: { type: String }, // Brief description of emotional state
  concerns: [String], // Key concerns or topics discussed
  supportNeeded: { type: String }, // Type of support user might need
  musicPreferences: { type: String }, // What kind of music they're drawn to
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

const chatContextSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  conversationHistory: { type: [messageSchema], default: [] },
  emotionalContext: { type: emotionalContextSchema, default: {} },
  sessionCount: { type: Number, default: 0 },
  lastInteraction: { type: Date, default: Date.now },
  personalizedInsights: { type: String }, // AI-generated insights about user
  triviaShown: [String], // Track trivia already shown to avoid repetition
  quotesShown: [String], // Track quotes already shown
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
chatContextSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Keep only last 20 messages to manage context size
chatContextSchema.pre('save', function(next) {
  if (this.conversationHistory.length > 20) {
    this.conversationHistory = this.conversationHistory.slice(-20);
  }
  next();
});

export default mongoose.models.ChatContext || mongoose.model("ChatContext", chatContextSchema);
