const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    url: { type: String, default: undefined },
    section: { type: String, default: "" },
    topic: { type: String, default: "" },
    category: { type: String, default: "" },
    title: { type: String, default: "" },
    published_at: { type: String, default: "" },
    summary: { type: String, default: "" },
    content: { type: [String], default: [] },
    scraped_at: { type: String, default: "" },
    views: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved", 
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: { type: String, default: "" },
  },
  {
    strict: false,
    timestamps: true,
  }
);


articleSchema.index(
  { url: 1 },
  { unique: true, partialFilterExpression: { url: { $type: "string" } } }
);

module.exports = mongoose.model("Article", articleSchema);
