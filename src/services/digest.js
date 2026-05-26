const Groq = require('groq-sdk')
const db = require('./db')
const Store = require('electron-store')

const store = new Store()

function getWeekLabel() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  return monday.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
}

const TARGET_WORDS = 1600

async function generate() {
  const apiKey = store.get('groqApiKey')
  if (!apiKey) {
    return { error: 'Clé API Groq manquante. Configurez-la dans les préférences. Compte gratuit sur console.groq.com' }
  }

  const articles = db.getArticles({ limit: 200 })
  if (articles.length === 0) {
    return { error: 'Aucun article disponible pour générer un résumé.' }
  }

  const articlesText = articles
    .slice(0, 60)
    .map((a, i) =>
      `[${i + 1}] SOURCE: ${a.source} (${a.source_type.toUpperCase()}) | RÉGION: ${a.region || 'N/A'} | THÈMES: ${a.themes.join(', ')}\nTITRE: ${a.title}\nRÉSUMÉ: ${a.snippet}\nURL: ${a.url}\n`
    )
    .join('\n---\n')

  const client = new Groq({ apiKey })

  const message = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `Tu es le rédacteur du bulletin hebdomadaire "Rurale-Nous"...
ARTICLES À ANALYSER :
${articlesText}`,
      },
    ],
  })

  const content = message.choices[0].message.content
  const wordCount = content.split(/\s+/).length
  const readTimeSec = Math.round((wordCount / 200) * 60)

  const digest = {
    week_label: getWeekLabel(),
    content,
    article_ids: articles.map(a => a.id),
    read_time_s: readTimeSec,
  }

  db.insertDigest(digest)
  return digest
}

function getLatest() {
  return db.getLatestDigest()
}

module.exports = { generate, getLatest }