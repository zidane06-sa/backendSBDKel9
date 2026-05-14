const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    section: { type: String, default: "" },
    topic: { type: String, default: "" },
    category: { type: String, default: "" },
    title: { type: String, default: "" },
    published_at: { type: String, default: "" },
    summary: { type: String, default: "" },
    content: { type: [String], default: [] },
    scraped_at: { type: String, default: "" },
  },
  {
    strict: false,
    timestamps: true,
  }
);

articleSchema.index({ url: 1 }, { unique: true });

module.exports = mongoose.model("Article", articleSchema);