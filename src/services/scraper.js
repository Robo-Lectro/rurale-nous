const Parser = require('rss-parser')
const axios = require('axios')
const cheerio = require('cheerio')
const db = require('./db')
const classifier = require('./classifier')

const parser = new Parser({ timeout: 10000 })

// ─── Sources ─────────────────────────────────────────────────────────────────

const SOURCES = [
  // Organismes municipaux
  { name: 'RIMQ', type: 'rimq', url: 'https://rimq.qc.ca/feed/', isRss: true },
  { name: 'UMQ', type: 'umq', url: 'https://umq.qc.ca/feed/', isRss: true },
  { name: 'FMQ', type: 'fmq', url: 'https://www.fcm.ca/fr/rss.xml', isRss: true },

  // Médias régionaux (RSS)
  { name: 'Radio-Canada Québec', type: 'media', url: 'https://ici.radio-canada.ca/rss/4159', isRss: true, region: 'Québec' },
  { name: 'Radio-Canada Mauricie', type: 'media', url: 'https://ici.radio-canada.ca/rss/5816', isRss: true, region: 'Mauricie' },
  { name: 'Radio-Canada BSL', type: 'media', url: 'https://ici.radio-canada.ca/rss/5815', isRss: true, region: 'Bas-Saint-Laurent' },
  { name: 'Radio-Canada Gaspésie', type: 'media', url: 'https://ici.radio-canada.ca/rss/5817', isRss: true, region: 'Gaspésie' },
  { name: 'Radio-Canada Abitibi', type: 'media', url: 'https://ici.radio-canada.ca/rss/5818', isRss: true, region: 'Abitibi-Témiscamingue' },
  { name: 'Radio-Canada Côte-Nord', type: 'media', url: 'https://ici.radio-canada.ca/rss/5819', isRss: true, region: 'Côte-Nord' },
  { name: 'Radio-Canada Saguenay', type: 'media', url: 'https://ici.radio-canada.ca/rss/5814', isRss: true, region: 'Saguenay-Lac-Saint-Jean' },
  { name: 'Radio-Canada Estrie', type: 'media', url: 'https://ici.radio-canada.ca/rss/5821', isRss: true, region: 'Estrie' },
  { name: 'Radio-Canada Chaudière', type: 'media', url: 'https://ici.radio-canada.ca/rss/5820', isRss: true, region: 'Chaudière-Appalaches' },
  { name: 'Le Devoir Régions', type: 'media', url: 'https://www.ledevoir.com/rss/regions.xml', isRss: true },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Estimation temps de lecture (mots × 200 mpm → secondes)
function estimateReadTime(text = '') {
  const words = text.trim().split(/\s+/).length
  return Math.round((words / 200) * 60)
}

// Détecter la région d'un article depuis son texte/titre si non fourni par la source
const REGION_KEYWORDS = {
  'Mauricie': ['mauricie', 'trois-rivières', 'shawinigan', 'mékinac', 'saint-tite', 'louiseville'],
  'Bas-Saint-Laurent': ['bas-saint-laurent', 'rimouski', 'rivière-du-loup', 'matane', 'amqui', 'témiscouata'],
  'Gaspésie': ['gaspésie', 'gaspé', 'matane', 'percé', 'bonaventure', 'chaleurs'],
  'Abitibi-Témiscamingue': ['abitibi', 'témiscamingue', 'rouyn', 'val-d\'or', 'amos'],
  'Saguenay-Lac-Saint-Jean': ['saguenay', 'lac-saint-jean', 'chicoutimi', 'jonquière', 'alma', 'roberval'],
  'Chaudière-Appalaches': ['chaudière', 'appalaches', 'lévis', 'la pocatière', 'montmagny', 'thetford'],
  'Côte-Nord': ['côte-nord', 'sept-îles', 'baie-comeau', 'manicouagan'],
  'Estrie': ['estrie', 'sherbrooke', 'magog', 'coaticook', 'mégantic'],
  'Outaouais': ['outaouais', 'gatineau', 'pontiac', 'papineau'],
  'Lanaudière': ['lanaudière', 'joliette', 'rawdon', 'berthierville'],
  'Laurentides': ['laurentides', 'saint-jérôme', 'mont-tremblant'],
  'Montérégie': ['montérégie', 'saint-hyacinthe', 'granby', 'sorel'],
  'Centre-du-Québec': ['centre-du-québec', 'drummondville', 'victoriaville', 'bécancour'],
}

function detectRegion(text) {
  const lower = text.toLowerCase()
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return region
  }
  return null
}

// ─── Scrape one RSS source ────────────────────────────────────────────────────

async function scrapeRss(source) {
  const feed = await parser.parseURL(source.url)
  const articles = []

  for (const item of (feed.items || []).slice(0, 30)) {
    const text = [item.title, item.contentSnippet, item.content].filter(Boolean).join(' ')
    const classification = classifier.classify(text)

    // Filtrer : on garde seulement ce qui est pertinent au monde rural québécois
    if (!classification.isRelevant) continue

    const region = source.region || detectRegion(text)
    const snippet = item.contentSnippet?.slice(0, 300) || ''

    const article = {
      guid: item.guid || item.link || `${source.name}-${item.title}`,
      title: item.title || '(sans titre)',
      url: item.link || '',
      source: source.name,
      source_type: source.type,
      region,
      published_at: item.isoDate || new Date().toISOString(),
      snippet,
      read_time_s: estimateReadTime(snippet),
      themes: classification.themes,
      is_good_practice: classification.isGoodPractice,
    }

    const isNew = db.insertArticle(article)
    if (isNew) articles.push(article)
  }

  return articles
}

// ─── Main scrape function ─────────────────────────────────────────────────────

async function scrapeAll() {
  let newArticles = 0
  const errors = []

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      try {
        const articles = await scrapeRss(source)
        return articles
      } catch (err) {
        errors.push({ source: source.name, error: err.message })
        return []
      }
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      newArticles += result.value.length
    }
  }

  // Recalculer les corrélations après chaque scrape
  const correlator = require('./correlator')
  await correlator.compute()

  return { newArticles, errors, scrapedAt: new Date().toISOString() }
}

module.exports = { scrapeAll }
