const express = require("express");
const articleController = require("../controllers/articleController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// === Publik ===
router.get("/", articleController.listArticles);                         // hanya approved


// === Guest/user yang login: submit artikel ===
router.post("/submit", authenticateToken, articleController.submitArticle);

// === User: list own submitted articles ===
router.get("/me", authenticateToken, articleController.listUserArticles);

// spesifik: ambil artikel by id
router.get("/:id", articleController.getArticleById);

// === Admin only ===
router.get("/admin/all", authenticateToken, requireRole("admin"), articleController.listAllArticles);   // semua artikel + filter status
router.patch("/:id/approve", authenticateToken, requireRole("admin"), articleController.approveArticle);
router.patch("/:id/reject", authenticateToken, requireRole("admin"), articleController.rejectArticle);
router.post("/", authenticateToken, requireRole("admin"), articleController.createArticles);
router.put("/:id", authenticateToken, requireRole("admin"), articleController.updateArticle);
router.delete("/:id", authenticateToken, requireRole("admin"), articleController.deleteArticle);

module.exports = router;
