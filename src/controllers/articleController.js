const articleService = require("../services/articleService");

// Admin: bulk upsert (flow lama)
async function createArticles(req, res) {
  try {
    const result = await articleService.saveArticles(req.body);
    return res.status(201).json({ message: "Data berhasil diproses", ...result });
  } catch (error) {
    const statusCode = error.statusCode || (error.code === 11000 ? 409 : 500);
    const message =
      statusCode === 409 ? "Ada data duplikat berdasarkan url" : error.message || "Gagal menyimpan data";
    return res.status(statusCode).json({ message, error: statusCode === 500 ? error.message : undefined });
  }
}

// Guest (atau siapapun yang login): submit artikel, masuk ke pending
async function submitArticle(req, res) {
  try {
    const article = await articleService.submitArticle(req.body, req.user.sub);
    return res.status(201).json({ message: "Artikel berhasil dikirim, menunggu persetujuan admin", data: article });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Gagal mengirim artikel" });
  }
}

// Publik: hanya artikel approved
async function listArticles(req, res) {
  try {
    const filters = {
      category: req.query.category,
      topic: req.query.topic,
    };
    const result = await articleService.getArticles(filters);
    console.log(`GET /api/articles - fetched ${result.data.length} items in ${result.durationMs.toFixed(2)} ms`);
    return res.status(200).json({ total: result.total, data: result.data });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil data", error: error.message });
  }
}

// Admin: lihat semua artikel (bisa filter ?status=pending)
async function listAllArticles(req, res) {
  try {
    const filters = { status: req.query.status };
    const result = await articleService.getAllArticles(filters);
    return res.status(200).json({ total: result.total, data: result.data });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil data", error: error.message });
  }
}

// User: list articles submitted by the authenticated user
async function listUserArticles(req, res) {
  try {
    const userId = req.user && req.user.sub;
    const result = await articleService.getArticlesByUser(userId);
    return res.status(200).json({ total: result.total, data: result.data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Gagal mengambil data" });
  }
}

async function getArticleById(req, res) {
  try {
    const article = await articleService.getArticleById(req.params.id);
    return res.status(200).json({ message: "Berhasil mengambil artikel", data: article });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "CastError" ? 400 : 500);
    return res.status(statusCode).json({ message: error.message || "Gagal mengambil artikel" });
  }
}

// Admin: approve artikel
async function approveArticle(req, res) {
  try {
    const article = await articleService.approveArticle(req.params.id, req.user.sub);
    return res.status(200).json({ message: "Artikel berhasil disetujui", data: article });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || "Gagal menyetujui artikel" });
  }
}

// Admin: reject artikel
async function rejectArticle(req, res) {
  try {
    const { reason } = req.body;
    const article = await articleService.rejectArticle(req.params.id, req.user.sub, reason);
    return res.status(200).json({ message: "Artikel berhasil ditolak", data: article });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || "Gagal menolak artikel" });
  }
}

async function updateArticle(req, res) {
  try {
    const article = await articleService.updateArticleById(req.params.id, req.body);
    return res.status(200).json({ message: "Artikel berhasil diupdate", data: article });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "CastError" ? 400 : 500);
    return res.status(statusCode).json({ message: error.message || "Gagal mengupdate artikel" });
  }
}

async function deleteArticle(req, res) {
  try {
    await articleService.deleteArticleById(req.params.id);
    return res.status(200).json({ message: "Artikel berhasil dihapus" });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "CastError" ? 400 : 500);
    return res.status(statusCode).json({ message: error.message || "Gagal menghapus artikel" });
  }
}

module.exports = {
  createArticles,
  submitArticle,
  listArticles,
  listAllArticles,
  listUserArticles,
  getArticleById,
  approveArticle,
  rejectArticle,
  updateArticle,
  deleteArticle,
};
