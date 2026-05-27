import React, { useState } from 'react'

const STEPS = [
  {
    view: 'dashboard',
    title: 'Tableau de bord',
    body: 'Vue rapide de la veille: nombre d’articles collectés, articles du jour, bonnes pratiques repérées, régions actives, corrélations principales et derniers articles.',
    tip: 'Commencez ici après une collecte pour voir si l’application a trouvé assez de matière utile.',
  },
  {
    view: 'articles',
    title: 'Actualités',
    body: 'Bibliothèque des articles collectés depuis RIMQ, UMQ, FQM et la presse régionale. Les filtres servent à isoler un thème, une source ou une recherche précise.',
    tip: 'Cliquez sur un article pour ouvrir la source originale dans votre navigateur.',
  },
  {
    view: 'correlations',
    title: 'Corrélations',
    body: 'Cette page compare les thèmes détectés dans les articles. Le coefficient r va de -1 à 1: près de 1, deux thèmes apparaissent souvent ensemble; près de 0, il n’y a pas de tendance claire; sous 0, ils apparaissent plutôt séparément.',
    tip: 'Une corrélation est un signal de veille, pas une preuve. Elle sert à trouver des pistes à explorer.',
  },
  {
    view: 'digest',
    title: 'Résumé 8 minutes',
    body: 'Génère un bulletin stratégique avec Groq: points à retenir, initiatives, enjeux, corrélations possibles et sources à consulter.',
    tip: 'Si Groq refuse une demande trop grande, l’app utilise un format compact pour rester sous la limite.',
  },
  {
    view: 'settings',
    title: 'Préférences',
    body: 'C’est ici que vous enregistrez la clé API Groq. Elle reste sauvegardée localement sur l’ordinateur.',
    tip: 'La clé doit commencer par gsk_. Ne la mettez jamais dans GitHub ou dans le code.',
  },
  {
    view: null,
    title: 'Collecte automatique',
    body: 'Le bouton Actualiser maintenant lance une collecte immédiate. L’app tente ensuite de classer les articles par source, région et thème.',
    tip: 'Après une collecte, regardez le détail par source sous le bouton pour voir ce qui a été trouvé.',
  },
]

export default function Tutorial({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const step = STEPS[index]
  const isFirst = index === 0
  const isLast = index === STEPS.length - 1

  function goToStep(nextIndex) {
    const next = STEPS[nextIndex]
    setIndex(nextIndex)
    if (next?.view) onNavigate(next.view)
  }

  function openTutorial() {
    setOpen(true)
    setIndex(0)
    onNavigate('dashboard')
  }

  return (
    <>
      <button
        type="button"
        onClick={openTutorial}
        aria-label="Ouvrir le tutoriel"
        title="Tutoriel"
        style={{
          position: 'fixed',
          top: 14,
          right: 16,
          zIndex: 30,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '0.5px solid var(--border-strong)',
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        ?
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0,0,0,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            width: 'min(560px, 100%)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 18px 60px rgba(0,0,0,0.24)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 18px',
              borderBottom: '0.5px solid var(--border)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  Étape {index + 1} sur {STEPS.length}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{step.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '0.5px solid var(--border)',
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '18px 20px 20px' }}>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>
                {step.body}
              </p>
              <div style={{
                marginTop: 16,
                padding: '12px 14px',
                background: 'var(--green-50)',
                color: 'var(--green-800)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                {step.tip}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 18px',
              borderTop: '0.5px solid var(--border)',
            }}>
              <button
                type="button"
                onClick={() => goToStep(index - 1)}
                disabled={isFirst}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '0.5px solid var(--border)',
                  background: 'var(--surface-secondary)',
                  color: isFirst ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: isFirst ? 'default' : 'pointer',
                }}
              >
                Précédent
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={() => (isLast ? setOpen(false) : goToStep(index + 1))}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--green-600)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {isLast ? 'Terminer' : 'Suivant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
