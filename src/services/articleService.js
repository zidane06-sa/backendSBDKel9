const Article = require("../models/Article");

function normalizeIncomingItems(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [payload];
}

// Admin: bulk upsert (flow lama, tetap approved)
async function saveArticles(payload) {
  const incomingItems = normalizeIncomingItems(payload);
  const validItems = incomingItems.filter((item) => item && typeof item === "object" && item.url);

  if (validItems.length === 0) {
    const error = new Error("Data artikel tidak valid");
    error.statusCode = 400;
    throw error;
  }

  const operations = validItems.map((item) => ({
    updateOne: {
      filter: { url: item.url },
      update: { $set: { ...item, status: "approved" } },
      upsert: true,
    },
  }));

  const result = await Article.bulkWrite(operations, { ordered: false });

  return {
    total_received: incomingItems.length,
    total_valid: validItems.length,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
  };
}

// Guest: submit artikel baru, status = pending
async function submitArticle(payload, userId) {
  const { title, summary, content, category, image } = payload;
  const normalizedCategory = payload.category || payload.topic || "";

  if (!title || !summary) {
    const error = new Error("title dan summary wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  // Normalize content jadi array
  const contentArray = Array.isArray(content)
    ? content
    : typeof content === "string"
    ? content.split(/\n{2,}/).filter(Boolean)
    : [];

  const articleData = {
    title,
    summary,
    content: contentArray,
    topic: normalizedCategory,
    category: normalizedCategory,
    image: image || "",
    status: "pending",
    submittedBy: userId,
  };

  // If client sent `url` but it's empty/null, avoid storing it as `null`.
  // Storing `url: null` causes the unique index to treat `null` as a value
  // and multiple `null` entries fail with E11000. Only set `url` when
  // it's a non-empty string.
  if (payload && typeof payload.url === 'string' && payload.url.trim() !== '') {
    articleData.url = payload.url.trim();
  }

  const article = await Article.create(articleData);

  return article;
}

// Publik: hanya tampilkan yang approved
async function getArticles(filters = {}) {
  const start = process.hrtime.bigint();

  const baseStatusQuery = {
    $or: [
      { status: "approved" },
      { status: { $exists: false } },
    ],
  };

  const query = { ...baseStatusQuery };
  if (filters.category) query.category = filters.category;
  if (filters.topic) query.topic = filters.topic;

  const data = await Article.find(query)
    .sort({ createdAt: -1 })
    .populate("submittedBy", "username email")
    .lean();

  const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
  return { total: data.length, data, durationMs };
}

// Admin: lihat semua artikel, bisa filter by status
async function getAllArticles(filters = {}) {
  const start = process.hrtime.bigint();
  const query = {};

  if (filters.status) {
    if (filters.status === "approved") {
      query.$or = [{ status: "approved" }, { status: { $exists: false } }];
    } else {
      query.status = filters.status;
    }
  }

  const data = await Article.find(query)
    .sort({ createdAt: -1 })
    .populate("submittedBy", "username email")
    .populate("reviewedBy", "username email")
    .lean();

  const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
  return { total: data.length, data, durationMs };
}

async function getArticleById(articleId) {
  if (!articleId) {
    const error = new Error("ID artikel wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const article = await Article.findById(articleId)
    .populate("submittedBy", "username email")
    .lean();

  if (!article) {
    const error = new Error("Artikel tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return article;
}

// Admin: approve artikel
async function approveArticle(articleId, adminId) {
  const article = await Article.findByIdAndUpdate(
    articleId,
    { status: "approved", reviewedBy: adminId, rejectionReason: "" },
    { new: true }
  );

  if (!article) {
    const error = new Error("Artikel tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return article;
}

// Admin: reject artikel
async function rejectArticle(articleId, adminId, reason) {
  const article = await Article.findByIdAndUpdate(
    articleId,
    { status: "rejected", reviewedBy: adminId, rejectionReason: reason || "" },
    { new: true }
  );

  if (!article) {
    const error = new Error("Artikel tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return article;
}

async function updateArticleById(articleId, payload) {
  if (!articleId) {
    const error = new Error("ID artikel wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    const error = new Error("Body request tidak valid");
    error.statusCode = 400;
    throw error;
  }

  const article = await Article.findByIdAndUpdate(
    articleId,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!article) {
    const error = new Error("Artikel tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return article;
}

async function deleteArticleById(articleId) {
  if (!articleId) {
    const error = new Error("ID artikel wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const article = await Article.findByIdAndDelete(articleId);
  if (!article) {
    const error = new Error("Artikel tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return article;
}

module.exports = {
  saveArticles,
  submitArticle,
  getArticles,
  getAllArticles,
  // Get articles created/submitted by a specific user
  async getArticlesByUser(userId) {
    const start = process.hrtime.bigint();
    if (!userId) {
      const error = new Error('User ID wajib diisi');
      error.statusCode = 400;
      throw error;
    }

    const query = { submittedBy: userId };
    const data = await Article.find(query)
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'username email')
      .populate('reviewedBy', 'username email')
      .lean();

    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    return { total: data.length, data, durationMs };
  },
  getArticleById,
  approveArticle,
  rejectArticle,
  updateArticleById,
  deleteArticleById,
};
