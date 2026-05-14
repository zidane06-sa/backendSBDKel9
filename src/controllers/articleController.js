const articleService = require("../services/articleService");

async function createArticles(req, res) {
  try {
    const result = await articleService.saveArticles(req.body);

    return res.status(201).json({
      message: "Data berhasil diproses",
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.code === 11000 ? 409 : 500);
    const message =
      statusCode === 409 ? "Ada data duplikat berdasarkan url" : error.message || "Gagal menyimpan data";

    return res.status(statusCode).json({
      message,
      error: statusCode === 500 ? error.message : undefined,
    });
  }
}

async function listArticles(_req, res) {
  try {
    const result = await articleService.getArticles();
    console.log(
      `GET /api/articles - fetched ${result.data.length} items in ${result.durationMs.toFixed(2)} ms`
    );

    return res.status(200).json({
      total: result.total,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil data", error: error.message });
  }
}

async function updateArticle(req, res) {
  try {
    const article = await articleService.updateArticleById(req.params.id, req.body);

    return res.status(200).json({
      message: "Artikel berhasil diupdate",
      data: article,
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "CastError" ? 400 : 500);
    return res.status(statusCode).json({
      message: error.message || "Gagal mengupdate artikel",
      error: statusCode === 500 ? error.message : undefined,
    });
  }
}

async function deleteArticle(req, res) {
  try {
    await articleService.deleteArticleById(req.params.id);
    return res.status(200).json({ message: "Artikel berhasil dihapus" });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "CastError" ? 400 : 500);
    return res.status(statusCode).json({
      message: error.message || "Gagal menghapus artikel",
      error: statusCode === 500 ? error.message : undefined,
    });
  }
}

module.exports = {
  createArticles,
  listArticles,
  updateArticle,
  deleteArticle,
};