const express = require("express");
const articleController = require("../controllers/articleController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// === Debug ===
router.get("/debug/all-count", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const Article = require("../models/Article");
    
    const count = await mongoose.connection.collection("articles").countDocuments();
    const sample = await mongoose.connection.collection("articles").findOne();
    
    // Test query without populate
    const condition = {
      $or: [
        { status: "approved" },
        { status: { $exists: false } },
      ],
    };
    const testNoPopulate = await Article.find(condition).lean().exec();
    
    // Test query WITH populate
    let testWithPopulate = [];
    let populateError = null;
    try {
      testWithPopulate = await Article.find(condition)
        .populate("submittedBy", "username email")
        .lean()
        .exec();
    } catch (e) {
      populateError = e.message;
    }
    
    return res.json({ 
      total_count: count, 
      test_no_populate: testNoPopulate.length,
      test_with_populate: testWithPopulate.length,
      populate_error: populateError
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// === Publik ===
router.get("/", articleController.listArticles);                        


router.post("/submit", authenticateToken, articleController.submitArticle);

router.get("/me", authenticateToken, articleController.listUserArticles);

router.get("/admin/all", authenticateToken, requireRole("admin"), articleController.listAllArticles);   
router.patch("/:id/approve", authenticateToken, requireRole("admin"), articleController.approveArticle);
router.patch("/:id/reject", authenticateToken, requireRole("admin"), articleController.rejectArticle);
router.post("/", authenticateToken, requireRole("admin"), articleController.createArticles);
router.put("/:id", authenticateToken, requireRole("admin"), articleController.updateArticle);
router.delete("/:id", authenticateToken, requireRole("admin"), articleController.deleteArticle);

router.patch("/:id/views", articleController.incrementViews);
router.get("/:id", articleController.getArticleById);

module.exports = router;
