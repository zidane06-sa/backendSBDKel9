const express = require("express");
const authController = require("../controllers/authController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticateToken, authController.me);
router.delete("/me", authenticateToken, authController.deleteAccount);
router.get("/admin", authenticateToken, requireRole("admin"), authController.adminOnly);

module.exports = router;

