// ─── Mots-clés de pertinence rurale ──────────────────────────────────────────

const RELEVANCE_KEYWORDS = [
  'rural', 'municipalité', 'municipality', 'village', 'canton', 'mrc', 'région',
  'communauté', 'habitant', 'municipal', 'maire', 'conseil municipal',
  'rimq', 'umq', 'fmq', 'union des municipalités', 'fédération des municipalités',
  'dépeuplement', 'exode', 'revitalisation', 'développement territorial',
  'milieu rural', 'collectivité rurale', 'petite communauté',
]

// ─── Thèmes ───────────────────────────────────────────────────────────────────

const THEME_KEYWORDS = {
  transport: [
    'transport collectif', 'autobus', 'bus', 'minibus', 'covoiturage',
    'transport à la demande', 'navette', 'mobilité', 'déplacement',
    'circuit', 'terminus', 'arrêt', 'intermodal',
  ],
  developpement: [
    'développement', 'revitalisation', 'investissement', 'projet',
    'économie locale', 'emploi', 'entrepreneur', 'coopérative',
    'plan de développement', 'zone industrielle',
  ],
  defi_rural: [
    'pénurie', 'désert', 'exode', 'dépeuplement', 'vieillissement',
    'fermeture', 'manque de services', 'accès limité', 'isolement',
    'problème', 'défi', 'difficulté',
  ],
  bonne_pratique: [
    'initiative', 'innovation', 'modèle', 'exemple', 'réussite',
    'bonne pratique', 'solution', 'succès', 'pilote', 'expérimentation',
    'inspire', 'exemplaire', 'programme',
  ],
  environnement: [
    'environnement', 'écologie', 'énergie renouvelable', 'solaire', 'éolien',
    'eau', 'forêt', 'biodiversité', 'agriculture', 'agroalimentaire',
    'compostage', 'recyclage', 'GES', 'carbone',
  ],
  economie: [
    'économie', 'budget', 'finances', 'taxe', 'subvention', 'financement',
    'fonds', 'investissement', 'dépense', 'revenu', 'PIB',
  ],
  sante: [
    'santé', 'médecin', 'infirmier', 'hôpital', 'clinique', 'soins',
    'CLSC', 'GMF', 'accès aux soins', 'télémédecine', 'aîné',
  ],
  logement: [
    'logement', 'habitation', 'locataire', 'propriétaire', 'loyer',
    'construction', 'résidence', 'HLM', 'coopérative d\'habitation',
  ],
}

// ─── Classificateur ───────────────────────────────────────────────────────────

function classify(text) {
  if (!text) return { isRelevant: false, themes: [], isGoodPractice: false }

  const lower = text.toLowerCase()

  // Pertinence : au moins un mot-clé rural présent
  const isRelevant = RELEVANCE_KEYWORDS.some(kw => lower.includes(kw))

  // Thèmes détectés
  const themes = []
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    const hits = keywords.filter(kw => lower.includes(kw)).length
    if (hits >= 1) themes.push(theme)
  }

  // Bonne pratique : thème explicite OU combinaison transport + développement
  const isGoodPractice =
    themes.includes('bonne_pratique') ||
    (themes.includes('transport') && themes.includes('developpement'))

  return { isRelevant, themes, isGoodPractice }
}

module.exports = { classify }
