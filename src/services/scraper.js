const Parser = require('rss-parser')
const cheerio = require('cheerio')
const db = require('./db')
const classifier = require('./classifier')

const parser = new Parser()
const REQUEST_TIMEOUT_MS = 15000
const USER_AGENT = 'Rurale-Nious/0.1 (+https://github.com/Robo-Lectro/rurale-nous)'

const LOCAL_REGIONAL_MEDIA = [
  { name: 'La Nouvelle Union', url: 'https://www.lanouvelle.net/feed/', region: 'Centre-du-Québec' },
  { name: 'Le Courrier Sud', url: 'https://www.lecourriersud.com/feed/', region: 'Centre-du-Québec' },
  { name: 'L’Hebdo du St-Maurice', url: 'https://www.lhebdodustmaurice.com/feed/', region: 'Mauricie' },
  { name: 'L’Écho de Maskinongé', url: 'https://www.lechodemaskinonge.com/feed/', region: 'Mauricie' },
  { name: 'L’Éclaireur Progrès', url: 'https://www.leclaireurprogres.ca/feed/', region: 'Chaudière-Appalaches' },
  { name: 'La Voix du Sud', url: 'https://www.lavoixdusud.com/feed/', region: 'Chaudière-Appalaches' },
  { name: 'Le Placoteux', url: 'https://leplacoteux.com/feed/', region: 'Bas-Saint-Laurent' },
  { name: 'Info Dimanche', url: 'https://www.infodimanche.com/feed/', region: 'Bas-Saint-Laurent' },
  { name: 'Le Charlevoisien', url: 'https://www.lecharlevoisien.com/feed/', region: 'Capitale-Nationale' },
  { name: 'Gaspésie Nouvelles', url: 'https://www.gaspesienouvelles.com/feed/', region: 'Gaspésie' },
  { name: 'Le Reflet du Lac', url: 'https://www.lerefletdulac.com/feed/', region: 'Estrie' },
  { name: 'Journal Le Nord', url: 'https://www.journallenord.com/feed/', region: 'Laurentides' },
  { name: 'Les Versants', url: 'https://www.versants.com/feed/', region: 'Montérégie' },
  { name: 'La Relève', url: 'https://www.lareleve.qc.ca/feed/', region: 'Montérégie' },
  { name: 'Le Nord-Côtier', url: 'https://lenord-cotier.com/feed/', region: 'Côte-Nord' },
  { name: 'Le Manic', url: 'https://www.lemanic.ca/feed/', region: 'Côte-Nord' },
  { name: 'Journal Haute-Côte-Nord', url: 'https://www.journalhcn.com/feed/', region: 'Côte-Nord' },
  { name: 'L’Indice bohémien', url: 'https://indicebohemien.org/feed/', region: 'Abitibi-Témiscamingue' },
]

const SOURCES = [
  // Organismes municipaux et ruraux
  { name: 'RIMQ', type: 'rimq', url: 'https://rimq.qc.ca/', kind: 'rimq-html', forceRelevant: true },
  { name: 'UMQ', type: 'umq', url: 'https://umq.qc.ca/feed/', kind: 'rss', forceRelevant: true },
  { name: 'FQM - Actualités', type: 'fqm', url: 'https://fqm.ca/blogue/actualites/', kind: 'fqm-html', forceRelevant: true },
  { name: 'FQM - Communiqués', type: 'fqm', url: 'https://fqm.ca/medias/communiques/', kind: 'fqm-html', forceRelevant: true },

  // Presse régionale québécoise
  { name: 'Radio-Canada Québec', type: 'media', url: 'https://ici.radio-canada.ca/rss/4159', kind: 'rss', region: 'Québec' },
  ...LOCAL_REGIONAL_MEDIA.map(source => ({ ...source, type: 'media', kind: 'rss', limit: 25 })),
]

function absoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return ''
  }
}

async function fetchText(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    return response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function estimateReadTime(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(15, Math.round((words / 200) * 60))
}

const REGION_KEYWORDS = {
  Mauricie: ['mauricie', 'trois-rivières', 'shawinigan', 'mékinac', 'saint-tite', 'louiseville'],
  'Bas-Saint-Laurent': ['bas-saint-laurent', 'rimouski', 'rivière-du-loup', 'matane', 'amqui', 'témiscouata'],
  Gaspésie: ['gaspésie', 'gaspé', 'percé', 'bonaventure', 'chaleurs'],
  'Abitibi-Témiscamingue': ['abitibi', 'témiscamingue', 'rouyn', "val-d'or", 'amos'],
  'Saguenay-Lac-Saint-Jean': ['saguenay', 'lac-saint-jean', 'chicoutimi', 'jonquière', 'alma', 'roberval'],
  'Chaudière-Appalaches': ['chaudière', 'appalaches', 'lévis', 'la pocatière', 'montmagny', 'thetford'],
  'Côte-Nord': ['côte-nord', 'sept-îles', 'baie-comeau', 'manicouagan', 'minganie'],
  Estrie: ['estrie', 'sherbrooke', 'magog', 'coaticook', 'mégantic'],
  Outaouais: ['outaouais', 'gatineau', 'pontiac', 'papineau'],
  Lanaudière: ['lanaudière', 'joliette', 'rawdon', 'berthierville'],
  Laurentides: ['laurentides', 'saint-jérôme', 'mont-tremblant'],
  Montérégie: ['montérégie', 'saint-hyacinthe', 'granby', 'sorel'],
  'Centre-du-Québec': ['centre-du-québec', 'drummondville', 'victoriaville', 'bécancour'],
}

function detectRegion(text) {
  const lower = text.toLowerCase()
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return region
  }
  return null
}

function toArticle(raw, source) {
  const text = [raw.title, raw.snippet].filter(Boolean).join(' ')
  const classification = classifier.classify(text)

  if (!source.forceRelevant && !classification.isRelevant) return null

  return {
    guid: raw.guid || raw.url || `${source.name}-${raw.title}`,
    title: raw.title || '(sans titre)',
    url: raw.url || '',
    source: source.name,
    source_type: source.type,
    region: source.region || raw.region || detectRegion(text),
    published_at: raw.published_at || new Date().toISOString(),
    snippet: (raw.snippet || '').slice(0, 450),
    read_time_s: estimateReadTime(raw.snippet || raw.title || ''),
    themes: classification.themes.length ? classification.themes : ['developpement'],
    is_good_practice: classification.isGoodPractice,
  }
}

async function scrapeRss(source) {
  const xml = await fetchText(source.url)
  const feed = await parser.parseString(xml)

  return (feed.items || []).slice(0, source.limit || 40)
    .map(item => toArticle({
      guid: item.guid || item.link,
      title: item.title,
      url: item.link,
      published_at: item.isoDate || item.pubDate,
      snippet: item.contentSnippet || item.content || item.summary || '',
    }, source))
    .filter(Boolean)
}

async function scrapeFqmHtml(source) {
  const html = await fetchText(source.url)
  const $ = cheerio.load(html)
  const articles = []

  $('article').each((_, el) => {
    const heading = $(el).find('h2, h3').first()
    const titleLink = $(el).find('h2 a, h3 a, a[href]').filter((__, link) => $(link).attr('href')).first()
    const title = (heading.text() || titleLink.text()).replace(/\s+/g, ' ').trim()
    const url = absoluteUrl(titleLink.attr('href'), source.url)
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    const date = $(el).find('time').attr('datetime') || undefined

    if (title && url) {
      articles.push(toArticle({
        guid: url,
        title,
        url,
        published_at: date,
        snippet: text,
      }, source))
    }
  })

  return articles.filter(Boolean).slice(0, 30)
}

async function scrapeRimqHtml(source) {
  const html = await fetchText(source.url)
  const $ = cheerio.load(html)
  const seen = new Set()
  const articles = []

  $('a[href*="/article/"]').each((_, el) => {
    const href = $(el).attr('href')
    const url = absoluteUrl(href, source.url)
    const title = $(el).text().replace(/\s+/g, ' ').trim()

    if (!url || seen.has(url) || title.length < 25 || /^\d{1,2}\s+\w+\s+\d{4}\s+-/.test(title)) return
    seen.add(url)

    const parentText = $(el).closest('div, li, td, article').text().replace(/\s+/g, ' ').trim()
    articles.push(toArticle({
      guid: url,
      title,
      url,
      snippet: parentText || title,
    }, source))
  })

  return articles.filter(Boolean).slice(0, 50)
}

async function scrapeSource(source) {
  if (source.kind === 'fqm-html') return scrapeFqmHtml(source)
  if (source.kind === 'rimq-html') return scrapeRimqHtml(source)
  return scrapeRss(source)
}

async function scrapeAll() {
  let newArticles = 0
  const errors = []
  const bySource = []

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      try {
        const articles = await scrapeSource(source)
        let inserted = 0

        for (const article of articles) {
          if (db.insertArticle(article)) inserted += 1
        }

        bySource.push({
          source: source.name,
          found: articles.length,
          newArticles: inserted,
        })

        return inserted
      } catch (err) {
        errors.push({ source: source.name, error: err.message })
        bySource.push({ source: source.name, found: 0, newArticles: 0, error: err.message })
        return 0
      }
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') newArticles += result.value
  }

  const correlator = require('./correlator')
  await correlator.compute()

  return {
    newArticles,
    bySource: bySource.sort((a, b) => a.source.localeCompare(b.source)),
    errors,
    scrapedAt: new Date().toISOString(),
  }
}

module.exports = { scrapeAll, SOURCES }
