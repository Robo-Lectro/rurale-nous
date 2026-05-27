const RELEVANCE_KEYWORDS = [
  'rural', 'rurale', 'ruraux', 'municipalité', 'municipalités', 'municipal',
  'village', 'mrc', 'région', 'régional', 'régions', 'communauté',
  'communautés', 'maire', 'mairesse', 'conseil municipal', 'élus',
  'rimq', 'umq', 'fqm', 'union des municipalités', 'fédération québécoise des municipalités',
  'dépeuplement', 'exode', 'revitalisation', 'développement territorial',
  'milieu rural', 'collectivité rurale', 'services de proximité',
  'transport', 'mobilité', 'logement', 'citoyen', 'famille', 'jeunesse',
]

const THEME_KEYWORDS = {
  transport: [
    'transport collectif', 'autobus', 'bus', 'minibus', 'covoiturage',
    'transport à la demande', 'navette', 'mobilité', 'déplacement',
    'circuit', 'terminus', 'arrêt', 'intermodal', 'rue-école',
  ],
  developpement: [
    'développement', 'revitalisation', 'investissement', 'projet',
    'économie locale', 'emploi', 'entrepreneur', 'coopérative',
    'plan de développement', 'zone industrielle', 'attractivité',
    'vitalité', 'territoire', 'régions', 'communautés',
  ],
  defi_rural: [
    'pénurie', 'désert', 'exode', 'dépeuplement', 'vieillissement',
    'fermeture', 'manque de services', 'accès limité', 'isolement',
    'problème', 'défi', 'difficulté', 'enjeu', 'main-d’oeuvre',
    'main-d’œuvre', 'sécurité', 'crise',
  ],
  bonne_pratique: [
    'initiative', 'innovation', 'modèle', 'exemple', 'réussite',
    'bonne pratique', 'solution', 'succès', 'pilote', 'expérimentation',
    'inspire', 'exemplaire', 'programme', 'prix', 'ovation', 'mérite',
  ],
  environnement: [
    'environnement', 'écologie', 'énergie renouvelable', 'solaire', 'éolien',
    'eau', 'forêt', 'biodiversité', 'agriculture', 'agroalimentaire',
    'compostage', 'recyclage', 'ges', 'carbone', 'climat',
    'changements climatiques', 'résilience',
  ],
  economie: [
    'économie', 'budget', 'finances', 'taxe', 'subvention', 'financement',
    'fonds', 'investissement', 'dépense', 'revenu', 'pib',
    'fiscalité', 'entreprise',
  ],
  sante: [
    'santé', 'médecin', 'infirmier', 'hôpital', 'clinique', 'soins',
    'clsc', 'gmf', 'accès aux soins', 'télémédecine', 'aîné',
  ],
  logement: [
    'logement', 'habitation', 'locataire', 'propriétaire', 'loyer',
    'construction', 'résidence', 'hlm', "coopérative d'habitation",
    'abordable',
  ],
  citoyen: [
    'citoyen', 'citoyenne', 'participation citoyenne', 'consultation',
    'budget participatif', 'bénévole', 'implication', 'famille',
    'jeunesse', 'jeunes',
  ],
}

function classify(text) {
  if (!text) return { isRelevant: false, themes: [], isGoodPractice: false }

  const lower = text.toLowerCase()
  const isRelevant = RELEVANCE_KEYWORDS.some(kw => lower.includes(kw))

  const themes = []
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    const hits = keywords.filter(kw => lower.includes(kw)).length
    if (hits >= 1) themes.push(theme)
  }

  const isGoodPractice =
    themes.includes('bonne_pratique') ||
    (themes.includes('transport') && themes.includes('developpement')) ||
    (themes.includes('citoyen') && themes.includes('developpement'))

  return { isRelevant, themes, isGoodPractice }
}

module.exports = { classify }
