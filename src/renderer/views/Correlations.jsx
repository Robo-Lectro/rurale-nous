import React, { useState, useEffect } from 'react'

function strengthLabel(value) {
  const abs = Math.abs(value)
  if (abs >= 0.7) return 'lien fort'
  if (abs >= 0.4) return 'lien modéré'
  if (abs >= 0.2) return 'lien faible'
  return 'signal très faible'
}

function directionLabel(value) {
  if (value > 0.05) return 'apparaissent souvent ensemble'
  if (value < -0.05) return 'apparaissent plutôt séparément'
  return 'ne montrent pas de tendance claire'
}

function reliabilityLabel(sampleSize) {
  if (sampleSize >= 40) return 'échantillon solide'
  if (sampleSize >= 15) return 'échantillon utile'
  return 'échantillon limité'
}

function barColor(value) {
  const abs = Math.abs(value)
  if (abs >= 0.7) return value > 0 ? 'var(--green-600)' : 'var(--coral-600)'
  if (abs >= 0.4) return value > 0 ? 'var(--green-400)' : 'var(--amber-400)'
  if (abs >= 0.2) return 'var(--gray-400)'
  return 'var(--gray-200)'
}

export default function Correlations() {
  const [correlations, setCorrelations] = useState([])

  useEffect(() => {
    window.api?.getCorrelations().then(c => c && setCorrelations(c))
  }, [])

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: 20, paddingRight: 44 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px', marginBottom: 4 }}>Corrélations</h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          Signaux qui croisent les thèmes détectés dans la veille rurale du Québec
        </p>
      </div>

      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 16,
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>À quoi ça sert?</strong>
        <br />
        Les corrélations aident à repérer des liens possibles entre des enjeux et des solutions. Par exemple, si
        “transport collectif” et “développement” montent ensemble, ça peut indiquer que la mobilité revient souvent
        dans les projets de vitalité locale.
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 10,
        marginBottom: 24,
      }}>
        <InfoCard title="Coefficient r" text="Va de -1 à 1. Plus il est loin de 0, plus le signal est marqué." />
        <InfoCard title="Valeur positive" text="Les deux thèmes apparaissent souvent ensemble dans les articles." />
        <InfoCard title="Valeur négative" text="Quand un thème apparaît, l’autre apparaît moins souvent. Ce n’est pas forcément mauvais." />
      </div>

      <div style={{
        background: 'var(--amber-50)', border: '0.5px solid rgba(186,117,23,0.2)',
        borderRadius: 'var(--radius-md)', padding: '11px 14px',
        color: 'var(--amber-600)', fontSize: 12, lineHeight: 1.5, marginBottom: 20,
      }}>
        Important : une corrélation n’est pas une preuve de causalité. C’est une piste de veille pour orienter une
        lecture, une recherche ou une discussion municipale.
      </div>

      {correlations.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center',
          color: 'var(--text-tertiary)',
        }}>
          Les corrélations seront disponibles après la première collecte d’articles.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {correlations.map((c, i) => {
            const coefficient = Number(c.coefficient || 0)
            const abs = Math.min(1, Math.abs(coefficient))

            return (
              <div key={i} style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                display: 'grid', gridTemplateColumns: '1fr 120px 100px', alignItems: 'center', gap: 20,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{c.note}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Ces thèmes {directionLabel(coefficient)} · {strengthLabel(coefficient)} · {reliabilityLabel(c.sample_size)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {c.sample_size} articles analysés · calculé le {new Date(c.computed_at).toLocaleDateString('fr-CA')}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 22, fontWeight: 500,
                    color: barColor(coefficient),
                  }}>
                    {coefficient.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>coefficient r</div>
                </div>

                <div>
                  <div style={{
                    height: 6,
                    background: 'var(--surface-secondary)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.round(abs * 100)}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: barColor(coefficient),
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 5, textAlign: 'right' }}>
                    force du signal
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InfoCard({ title, text }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{text}</div>
    </div>
  )
}
