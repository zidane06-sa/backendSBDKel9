const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const { connectDatabase } = require("./src/config/db");
const articleRoutes = require("./src/routes/articleRoutes");
const authRoutes = require("./src/routes/authRoutes");
const articleService = require("./src/services/articleService");
const { Pool } = require("pg");

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

app.get('/compare', async (req, res) => {
  const search = (req.query.search || '').trim();
  console.log('[/compare] request received, search=', search);

  // MongoDB
  let mongoResult = { total: 0, durationMs: 0, error: null };
  try {
    console.log('[/compare] attempting mongo fetch');
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB belum terkoneksi');
    }

    const mongoStart = process.hrtime.bigint();
    const mongoQuery = {};
    if (search) {
      const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      mongoQuery.$or = [
        { title: regex },
        { summary: regex },
        { category: regex },
        { topic: regex },
        { url: regex },
        { content: regex },
      ];
    }

    const rows = await mongoose
      .connection
      .collection('articles')
      .find(mongoQuery)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    mongoResult = {
      total: rows.length,
      durationMs: Number(process.hrtime.bigint() - mongoStart) / 1e6,
    };
    console.log('[/compare] mongo fetch done, total=', mongoResult.total, 'durationMs=', mongoResult.durationMs);
  } catch (e) {
    console.warn('[/compare] mongo fetch error', e.message);
    mongoResult.error = e.message;
  }

  // Postgres
  let pgResult = { total: 0, durationMs: null, error: null };
  try {
    console.log('[/compare] attempting postgres fetch');
    if (!pgPool) throw new Error('Postgres pool tidak dikonfigurasi');
    const client = await pgPool.connect();
    try {
      const params = [];
      let where = '';
      if (search) {
        const q = `%${search}%`;
        params.push(q, q, q, q, q);
        where = `WHERE title ILIKE $1 OR summary ILIKE $2 OR category ILIKE $3 OR topic ILIKE $4 OR url ILIKE $5`;
      }
      const sql = `SELECT id, url, section, topic, category, title, published_at, summary, content, scraped_at, created_at, updated_at FROM articles_pg ${where} ORDER BY scraped_at DESC NULLS LAST, created_at DESC`;
      const pgStart = process.hrtime.bigint();
      const result = await client.query(sql, params);
      pgResult = { total: result.rowCount, durationMs: Number(process.hrtime.bigint() - pgStart) / 1e6 };
      console.log('[/compare] pg fetch done, total=', pgResult.total, 'durationMs=', pgResult.durationMs);
    } finally {
      client.release();
    }
  } catch (e) {
    pgResult.error = e.message;
  }

  console.log('[/compare] sending response');
  return res.json({ mongo: mongoResult, postgres: pgResult });
});

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
      articles: [
        "GET /api/articles",
        "GET /api/articles/:id",
        "PATCH /api/articles/:id/views",
        "POST /api/articles (admin)",
        "PUT /api/articles/:id (admin)",
        "DELETE /api/articles/:id (admin)",
      ],
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);

// Postgres pool placeholder; will be initialized when server starts
const rawPgConn = process.env.POSTGRES_CONNECTION_STRING || process.env.POSTGRES_URL || "";
const pgDatabase = process.env.POSTGRES_DATABASE || "minpro_sbd";
function normalizeConnectionString(connectionString, databaseName) {
  if (!connectionString) return "";
  try {
    const url = new URL(connectionString);
    if (databaseName) url.pathname = `/${databaseName}`;
    return url.toString();
  } catch (e) {
    return connectionString;
  }
}
const pgConnStr = normalizeConnectionString(rawPgConn, pgDatabase);
let pgPool = null;

app.get('/api/compare', async (req, res) => {
  const search = (req.query.search || '').trim();

  try {
    const mongoStart = process.hrtime.bigint();
    const mongoResult = await articleService.getArticles({ search });
    const mongoDuration = mongoResult.durationMs || (Number(process.hrtime.bigint() - mongoStart) / 1e6);

    let pgResult = { total: 0, data: [], durationMs: null };
    if (pgPool) {
      const client = await pgPool.connect();
      try {
        const params = [];
        let where = '';
        if (search) {
          const q = `%${search}%`;
          params.push(q, q, q, q, q);
          where = `WHERE title ILIKE $1 OR summary ILIKE $2 OR category ILIKE $3 OR topic ILIKE $4 OR url ILIKE $5`;
        }

        const sql = `SELECT id, url, section, topic, category, title, published_at, summary, content, scraped_at, created_at, updated_at FROM articles_pg ${where} ORDER BY scraped_at DESC NULLS LAST, created_at DESC`;
        const pgStart = process.hrtime.bigint();
        const result = await client.query(sql, params);
        const pgDuration = Number(process.hrtime.bigint() - pgStart) / 1e6;
        pgResult = { total: result.rowCount, data: result.rows, durationMs: pgDuration };
      } finally {
        client.release();
      }
    }

    return res.json({
      mongo: { total: mongoResult.total, durationMs: mongoDuration },
      postgres: pgResult,
    });
  } catch (error) {
    console.error('Compare error', error);
    return res.status(500).json({ message: 'Gagal menjalankan perbandingan', error: error.message });
  }
});

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
  const maxPortRetries = Number(process.env.PORT_RETRY_COUNT || 5);

  const listenWithRetry = (startPort, retriesLeft) =>
    new Promise((resolve, reject) => {
      const server = app.listen(startPort, () => {
        console.log(`API berjalan di http://localhost:${startPort}`);
        resolve(server);
      });

      server.on("error", (error) => {
        if (error.code === "EADDRINUSE" && retriesLeft > 0) {
          const nextPort = startPort + 1;
          console.warn(`Port ${startPort} sedang dipakai, mencoba port ${nextPort}...`);
          return resolve(listenWithRetry(nextPort, retriesLeft - 1));
        }

        if (error.code === "EADDRINUSE") {
          return reject(new Error(`Semua port dari ${port} sampai ${startPort} sedang dipakai`));
        }

        return reject(error);
      });
    });

  await listenWithRetry(port, maxPortRetries);

  // Initialize Postgres pool (try normalized DB then fallback to raw connection)
  try {
    if (pgConnStr) {
      const candidate = new Pool({ connectionString: pgConnStr, ssl: { rejectUnauthorized: false } });
      try {
        await candidate.query('SELECT 1');
        pgPool = candidate;
        console.log('Postgres pool initialized (with database override)');
      } catch (e) {
        console.warn('PG connection with forced database failed, attempting raw connection:', e.message);
        try {
          if (rawPgConn) {
            const fallback = new Pool({ connectionString: rawPgConn, ssl: { rejectUnauthorized: false } });
            await fallback.query('SELECT 1');
            pgPool = fallback;
            console.log('Postgres pool initialized (raw connection)');
          }
        } catch (e2) {
          console.warn('PG fallback connection failed:', e2.message);
        }
      }
    }
  } catch (err) {
    console.warn('PG pool init error:', err.message);
  }

  connectDatabase(mongoUri, mongoDbName)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error) => {
      console.error("MongoDB connection failed, backend tetap dijalankan:", error.message);
    });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Gagal menjalankan server:", error.message);
    process.exit(1);
  });
}

module.exports = app;