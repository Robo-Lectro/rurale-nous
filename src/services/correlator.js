const db = require('./db')

// Calcule le coefficient de corrélation de Pearson entre deux vecteurs binaires
function pearson(a, b) {
  const n = a.length
  if (n === 0) return 0
  const meanA = a.reduce((s, v) => s + v, 0) / n
  const meanB = b.reduce((s, v) => s + v, 0) / n
  let num = 0, dA = 0, dB = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    num += da * db
    dA += da * da
    dB += db * db
  }
  if (dA === 0 || dB === 0) return 0
  return num / Math.sqrt(dA * dB)
}

// Paires de thèmes à croiser
const PAIRS = [
  ['transport', 'defi_rural', 'Transport collectif ↔ défis ruraux'],
  ['transport', 'developpement', 'Transport collectif ↔ développement'],
  ['bonne_pratique', 'developpement', 'Bonnes pratiques ↔ développement'],
  ['sante', 'defi_rural', 'Santé ↔ défis ruraux'],
  ['logement', 'defi_rural', 'Logement ↔ défis ruraux'],
  ['environnement', 'developpement', 'Environnement ↔ développement'],
]

async function compute() {
  const articles = db.getArticles({ limit: 1000 })
  if (articles.length < 10) return []

  const correlations = []

  for (const [themeA, themeB, note] of PAIRS) {
    const vectorA = articles.map(a => (a.themes.includes(themeA) ? 1 : 0))
    const vectorB = articles.map(a => (a.themes.includes(themeB) ? 1 : 0))

    const coefficient = pearson(vectorA, vectorB)
    const sampleSize = articles.filter(
      a => a.themes.includes(themeA) || a.themes.includes(themeB)
    ).length

    if (sampleSize >= 3) {
      correlations.push({
        theme_a: themeA,
        theme_b: themeB,
        coefficient: Math.round(coefficient * 100) / 100,
        sample_size: sampleSize,
        region: null,
        note,
      })
    }
  }

  // Stocker en base
  if (correlations.length > 0) {
    db.upsertCorrelations(correlations)
  }

  return correlations
}

function getCorrelations() {
  return db.getCorrelations()
}

module.exports = { compute, getCorrelations }
