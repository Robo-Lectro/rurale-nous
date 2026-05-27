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

async function generate() {
  const apiKey = String(store.get('groqApiKey') || '').trim()
  if (!apiKey) {
    return { error: 'Clé API Groq manquante. Configurez-la dans les préférences. Compte gratuit sur console.groq.com' }
  }

  const articles = db.getArticles({ limit: 200 })
  if (articles.length === 0) {
    return { error: 'Aucun article disponible pour générer un résumé. Lancez d’abord “Actualiser maintenant”.' }
  }

  const articlesText = articles
    .slice(0, 60)
    .map((a, i) =>
      `[${i + 1}] SOURCE: ${a.source} (${a.source_type.toUpperCase()}) | RÉGION: ${a.region || 'N/A'} | THÈMES: ${a.themes.join(', ')}\nTITRE: ${a.title}\nRÉSUMÉ: ${a.snippet}\nURL: ${a.url}\n`
    )
    .join('\n---\n')

  const client = new Groq({ apiKey })

  let message
  try {
    message = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 3000,
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content: [
            'Tu rédiges Rurale-Nious, une veille stratégique pour les municipalités rurales du Québec.',
            'Produit un résumé clair, utile et actionnable, lisible en environ 8 minutes.',
            'Mets en valeur les bonnes pratiques, les liens entre enjeux et solutions, et les références originales.',
          ].join(' '),
        },
        {
          role: 'user',
          content: `Prépare un bulletin structuré en français avec ces sections :
1. Points à retenir
2. Initiatives et bonnes pratiques
3. Enjeux ruraux détectés
4. Corrélations possibles entre problèmes et solutions
5. Sources et liens à consulter

ARTICLES À ANALYSER :
${articlesText}`,
        },
      ],
    })
  } catch (err) {
    return {
      error: `Groq n’a pas pu générer le résumé: ${err.message || 'erreur inconnue'}`,
    }
  }

  const content = message?.choices?.[0]?.message?.content
  if (!content) {
    return { error: 'Groq a répondu sans contenu exploitable. Réessayez dans quelques secondes.' }
  }

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
