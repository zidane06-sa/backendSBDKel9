const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const port = Number(process.env.PG_PORT) || 4001;
const postgresDb = process.env.POSTGRES_DATABASE || 'minpro_sbd';
const rawConnStr = process.env.POSTGRES_CONNECTION_STRING || process.env.POSTGRES_URL;

function normalizeConnectionString(connectionString, databaseName) {
  if (!connectionString) return '';

  const url = new URL(connectionString);
  if (databaseName) {
    url.pathname = `/${databaseName}`;
  }

  return url.toString();
}

const connStr = normalizeConnectionString(rawConnStr, postgresDb);

if (!connStr) {
  console.error('POSTGRES_CONNECTION_STRING tidak ditemukan di .env');
}

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
});

app.use(express.json({ limit: '10mb' }));
app.use(cors());

async function ensureSchema() {
  const sql = `
  CREATE TABLE IF NOT EXISTS articles_pg (
    id BIGSERIAL PRIMARY KEY,
    url TEXT UNIQUE,
    section TEXT,
    topic TEXT,
    category TEXT,
    title TEXT,
    published_at TEXT,
    summary TEXT,
    content JSONB,
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_articles_pg_url ON articles_pg(url);
  `;

  await pool.query(sql);
}

function extractItemsFromBody(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [payload];
}

app.post('/api/pg/articles', async (req, res) => {
  try {
    const items = extractItemsFromBody(req.body).filter(it => it && it.url);
    if (items.length === 0) return res.status(400).json({ message: 'Tidak ada data valid' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let upserted = 0;
      for (const item of items) {
        const q = `INSERT INTO articles_pg(url, section, topic, category, title, published_at, summary, content, scraped_at, updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
        ON CONFLICT (url) DO UPDATE SET
          section = EXCLUDED.section,
          topic = EXCLUDED.topic,
          category = EXCLUDED.category,
          title = EXCLUDED.title,
          published_at = EXCLUDED.published_at,
          summary = EXCLUDED.summary,
          content = EXCLUDED.content,
          scraped_at = EXCLUDED.scraped_at,
          updated_at = now();`;

        const params = [
          item.url || null,
          item.section || null,
          item.topic || null,
          item.category || null,
          item.title || null,
          item.published_at || null,
          item.summary || null,
          item.content ? JSON.stringify(item.content) : null,
          item.scraped_at ? new Date(item.scraped_at) : null,
        ];

        await client.query(q, params);
        upserted++;
      }
      await client.query('COMMIT');
      return res.status(201).json({ message: 'Data PG diproses', received: items.length, upserted });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal menyimpan ke Postgres', error: error.message });
  }
});

app.get('/api/pg/articles', async (req, res) => {
  try {
    const q = 'SELECT id, url, section, topic, category, title, published_at, summary, content, scraped_at, created_at, updated_at FROM articles_pg ORDER BY scraped_at DESC NULLS LAST, created_at DESC';
    const start = process.hrtime.bigint();
    const result = await pool.query(q);
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`GET /api/pg/articles - fetched ${result.rowCount} items in ${durationMs.toFixed(2)} ms`);
    return res.status(200).json({ total: result.rowCount, data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data dari Postgres', error: error.message });
  }
});

async function start() {
  try {
    await ensureSchema();
    app.listen(port, () => console.log(`PG API berjalan di http://localhost:${port}`));
  } catch (err) {
    console.error('Gagal start PG API', err);
    process.exit(1);
  }
}

start();
