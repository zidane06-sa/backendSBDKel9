const Article = require("../models/Article");

function normalizeIncomingItems(payload) {
  if (payload == null) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [payload];
}

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
      update: { $set: item },
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

async function getArticles() {
  const start = process.hrtime.bigint();
  const data = await Article.find({}).sort({ scraped_at: -1, createdAt: -1 }).lean();
  const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

  return {
    total: data.length,
    data,
    durationMs,
  };
}

async function getArticleById(articleId) {
  if (!articleId) {
    const error = new Error("ID artikel wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const article = await Article.findById(articleId).lean();

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

  const article = await Article.findByIdAndUpdate(articleId, { $set: payload }, { new: true, runValidators: true });

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
  getArticles,
  getArticleById,
  updateArticleById,
  deleteArticleById,
};