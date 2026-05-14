const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }

  try {
    const secret = process.env.JWT_SECRET || "dev-secret-key";
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token tidak valid" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};