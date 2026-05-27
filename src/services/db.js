const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const fs = require('fs')

const DB_PATH = app
  ? path.join(app.getPath('userData'), 'data', 'rurale-nous.db')
  : path.join(__dirname, '../../data/rurale-nous.db')

// S'assurer que le dossier existe
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guid        TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL,
    source      TEXT NOT NULL,
    source_type TEXT DEFAULT 'media',   -- media | rimq | umq | fqm
    region      TEXT,
    published_at TEXT,
    fetched_at  TEXT DEFAULT (datetime('now')),
    snippet     TEXT,
    full_text   TEXT,
    read_time_s INTEGER,
    themes      TEXT DEFAULT '[]',      -- JSON array: transport, developpement, defi, bonne_pratique, environnement, economie, sante
    is_good_practice INTEGER DEFAULT 0,
    is_read     INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS digests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT DEFAULT (datetime('now')),
    week_label  TEXT,
    content     TEXT,
    article_ids TEXT,  -- JSON array
    read_time_s INTEGER
  );

  CREATE TABLE IF NOT EXISTS correlations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    computed_at TEXT DEFAULT (datetime('now')),
    theme_a     TEXT,
    theme_b     TEXT,
    coefficient REAL,
    sample_size INTEGER,
    region      TEXT,
    note        TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);
  CREATE INDEX IF NOT EXISTS idx_articles_region ON articles(region);
  CREATE INDEX IF NOT EXISTS idx_articles_fetched ON articles(fetched_at);
`)

db.exec("UPDATE articles SET source_type = 'fqm', source = REPLACE(source, 'FMQ', 'FQM') WHERE source_type = 'fmq'")

// ─── Queries ─────────────────────────────────────────────────────────────────

function getArticles({ region, sourceType, theme, limit = 100, offset = 0 } = {}) {
  let q = 'SELECT * FROM articles WHERE 1=1'
  const params = []

  if (region) { q += ' AND region = ?'; params.push(region) }
  if (sourceType) { q += ' AND source_type = ?'; params.push(sourceType) }
  if (theme) { q += ' AND themes LIKE ?'; params.push(`%"${theme}"%`) }

  q += ' ORDER BY published_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const rows = db.prepare(q).all(...params)
  return rows.map(r => ({ ...r, themes: JSON.parse(r.themes || '[]') }))
}

function insertArticle(article) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO articles
      (guid, title, url, source, source_type, region, published_at, snippet, read_time_s, themes, is_good_practice)
    VALUES
      (@guid, @title, @url, @source, @source_type, @region, @published_at, @snippet, @read_time_s, @themes, @is_good_practice)
  `)
  const info = stmt.run({
    ...article,
    themes: JSON.stringify(article.themes || []),
    is_good_practice: article.is_good_practice ? 1 : 0,
  })
  return info.changes > 0
}

function getStats() {
  return {
    totalArticles: db.prepare('SELECT COUNT(*) as n FROM articles').get().n,
    todayArticles: db.prepare("SELECT COUNT(*) as n FROM articles WHERE date(fetched_at) = date('now')").get().n,
    goodPractices: db.prepare('SELECT COUNT(*) as n FROM articles WHERE is_good_practice = 1').get().n,
    activeRegions: db.prepare('SELECT COUNT(DISTINCT region) as n FROM articles WHERE region IS NOT NULL').get().n,
    bySource: db.prepare("SELECT source_type, COUNT(*) as n FROM articles GROUP BY source_type").all(),
    byRegion: db.prepare("SELECT region, COUNT(*) as n FROM articles WHERE region IS NOT NULL GROUP BY region ORDER BY n DESC LIMIT 10").all(),
  }
}

function insertDigest(digest) {
  db.prepare(`
    INSERT INTO digests (week_label, content, article_ids, read_time_s)
    VALUES (@week_label, @content, @article_ids, @read_time_s)
  `).run({
    ...digest,
    article_ids: JSON.stringify(digest.article_ids || []),
  })
}

function getLatestDigest() {
  const row = db.prepare('SELECT * FROM digests ORDER BY created_at DESC LIMIT 1').get()
  if (!row) return null
  return { ...row, article_ids: JSON.parse(row.article_ids || '[]') }
}

function upsertCorrelations(correlations) {
  const stmt = db.prepare(`
    INSERT INTO correlations (theme_a, theme_b, coefficient, sample_size, region, note)
    VALUES (@theme_a, @theme_b, @coefficient, @sample_size, @region, @note)
  `)
  const insert = db.transaction((rows) => rows.forEach(r => stmt.run(r)))
  insert(correlations)
}

function getCorrelations() {
  return db.prepare('SELECT * FROM correlations ORDER BY computed_at DESC LIMIT 20').all()
}

module.exports = { getArticles, insertArticle, getStats, insertDigest, getLatestDigest, upsertCorrelations, getCorrelations }
