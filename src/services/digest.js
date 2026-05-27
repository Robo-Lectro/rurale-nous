const Groq = require('groq-sdk')
const db = require('./db')
const Store = require('electron-store')

const store = new Store()

const MODEL = 'llama-3.3-70b-versatile'
const DIGEST_ATTEMPTS = [
  { articleLimit: 28, snippetLimit: 220, maxTokens: 1800 },
  { articleLimit: 18, snippetLimit: 160, maxTokens: 1400 },
  { articleLimit: 10, snippetLimit: 120, maxTokens: 1100 },
]

function getWeekLabel() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  return monday.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
}

function compact(text = '', maxLength = 180) {
  const cleaned = String(text).replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength - 1).trim()}…`
}

function buildArticlesText(articles, { articleLimit, snippetLimit }) {
  return articles
    .slice(0, articleLimit)
    .map((a, i) => {
      const themes = Array.isArray(a.themes) && a.themes.length ? a.themes.join(', ') : 'developpement'
      return [
        `[${i + 1}] ${compact(a.title, 120)}`,
        `Source: ${a.source} (${String(a.source_type || 'source').toUpperCase()})`,
        `Region: ${a.region || 'N/A'} | Themes: ${themes}`,
        `Resume: ${compact(a.snippet, snippetLimit)}`,
        `URL: ${a.url}`,
      ].join('\n')
    })
    .join('\n---\n')
}

function isTooLargeError(err) {
  const message = [
    err?.message,
    err?.error?.message,
    err?.code,
    err?.type,
  ].filter(Boolean).join(' ').toLowerCase()

  return err?.status === 413 ||
    message.includes('request too large') ||
    message.includes('rate_limit_exceeded') ||
    message.includes('tokens per minute') ||
    message.includes('tpm')
}

function friendlyGroqError(err) {
  if (isTooLargeError(err)) {
    return 'La demande envoyée à Groq était trop grosse pour la limite actuelle. Réessayez après une minute, ou actualisez moins de sources. L’app va maintenant utiliser un format de résumé plus compact.'
  }

  if (err?.status === 401 || err?.status === 403) {
    return 'La clé API Groq semble invalide ou refusée. Vérifiez la clé dans Préférences, puis réessayez.'
  }

  if (err?.status === 429) {
    return 'Groq limite temporairement les requêtes. Attendez environ une minute, puis réessayez.'
  }

  return `Groq n’a pas pu générer le résumé: ${err?.message || 'erreur inconnue'}`
}

async function createDigest(client, articles, attempt) {
  const articlesText = buildArticlesText(articles, attempt)

  return client.chat.completions.create({
    model: MODEL,
    max_tokens: attempt.maxTokens,
    temperature: 0.35,
    messages: [
      {
        role: 'system',
        content: [
          'Tu rédiges Rurale-Nious, une veille stratégique pour les municipalités rurales du Québec.',
          'Produit un résumé clair, utile et actionnable.',
          'Priorise les projets inspirants, les bonnes pratiques, les enjeux ruraux et les solutions transférables.',
          'Évite les longues introductions. Cite les sources et liens utiles dans la dernière section.',
        ].join(' '),
      },
      {
        role: 'user',
        content: `Prépare un bulletin structuré en français avec ces sections:
1. Points à retenir
2. Initiatives et bonnes pratiques
3. Enjeux ruraux détectés
4. Corrélations possibles entre problèmes et solutions
5. Sources et liens à consulter

Contrainte: reste concis, environ 700 à 1100 mots.

ARTICLES À ANALYSER:
${articlesText}`,
      },
    ],
  })
}

async function generate() {
  const apiKey = String(store.get('groqApiKey') || '').trim()
  if (!apiKey) {
    return { error: 'Clé API Groq manquante. Configurez-la dans les préférences. Compte gratuit sur console.groq.com' }
  }

  const articles = db.getArticles({ limit: 200 })
  if (articles.length === 0) {
    return { error: 'Aucun article disponible pour générer un résumé. Lancez d’abord “Actualiser maintenant”.' }
  }

  const client = new Groq({ apiKey })
  let message
  let lastError
  let usedAttempt = DIGEST_ATTEMPTS[0]

  for (const attempt of DIGEST_ATTEMPTS) {
    try {
      message = await createDigest(client, articles, attempt)
      usedAttempt = attempt
      break
    } catch (err) {
      lastError = err
      if (!isTooLargeError(err)) break
    }
  }

  if (!message) {
    return { error: friendlyGroqError(lastError) }
  }

  const content = message?.choices?.[0]?.message?.content
  if (!content) {
    return { error: 'Groq a répondu sans contenu exploitable. Réessayez dans quelques secondes.' }
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const readTimeSec = Math.round((wordCount / 200) * 60)

  const digest = {
    week_label: getWeekLabel(),
    content,
    article_ids: articles.slice(0, usedAttempt.articleLimit).map(a => a.id),
    read_time_s: readTimeSec,
  }

  db.insertDigest(digest)
  return digest
}

function getLatest() {
  return db.getLatestDigest()
}

module.exports = { generate, getLatest }
