import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  reportedUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  reason: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved", "dismissed"],
    default: "pending"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  reviewedAt: { 
    type: Date 
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"
  },
  adminNotes: {
    type: String
  }
});

// Indexes for performance
reportSchema.index({ reportedBy: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model("Report", reportSchema);
