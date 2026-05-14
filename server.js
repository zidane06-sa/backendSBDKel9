const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { connectDatabase } = require("./src/config/db");
const articleRoutes = require("./src/routes/articleRoutes");
const authRoutes = require("./src/routes/authRoutes");

dotenv.config();

const app = express();

const port = Number(process.env.PORT) || 4000;
const mongoUri = process.env.MONGO_URI;
const mongoDbName = process.env.MONGO_DB_NAME;
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(express.json({ limit: "5mb" }));
app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
  })
);

app.use("/api", async (_req, _res, next) => {
  try {
    await connectDatabase(mongoUri, mongoDbName);
    return next();
  } catch (error) {
    return next(error);
  }
});

app.get("/", (_req, res) => {
  res.json({
    message: "Backend berjalan",
    routes: {
      auth: ["POST /api/auth/register", "POST /api/auth/login", "GET /api/auth/me", "GET /api/auth/admin"],
      articles: ["GET /api/articles", "POST /api/articles (admin)", "PUT /api/articles/:id (admin)", "DELETE /api/articles/:id (admin)"],
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);

app.use((error, _req, res, _next) => {
  return res.status(500).json({
    message: "Gagal menghubungkan database",
    error: error.message,
  });
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route tidak ditemukan" });
});

async function startServer() {
  await connectDatabase(mongoUri, mongoDbName);

  app.listen(port, () => {
    console.log(`API berjalan di http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Gagal menjalankan server:", error.message);
    process.exit(1);
  });
}

module.exports = app;