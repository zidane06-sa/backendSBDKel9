const express = require("express");
const articleController = require("../controllers/articleController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", articleController.listArticles);
router.get("/:id", articleController.getArticleById);
router.post("/", authenticateToken, requireRole("admin"), articleController.createArticles);
router.put("/:id", authenticateToken, requireRole("admin"), articleController.updateArticle);
router.delete("/:id", authenticateToken, requireRole("admin"), articleController.deleteArticle);

module.exports = router;

