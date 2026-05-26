import React, { useState, useEffect } from 'react'

export default function Correlations() {
  const [correlations, setCorrelations] = useState([])

  useEffect(() => {
    window.api?.getCorrelations().then(c => c && setCorrelations(c))
  }, [])

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px', marginBottom: 4 }}>Corrélations</h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          Croisement des thèmes entre municipalités rurales du Québec
        </p>
      </div>

      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 24,
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        Les corrélations sont calculées automatiquement après chaque collecte d'articles. Un coefficient proche de 1.0 indique que les deux thèmes apparaissent souvent ensemble dans les mêmes municipalités.
      </div>

      {correlations.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center',
          color: 'var(--text-tertiary)',
        }}>
          Les corrélations seront disponibles après la première collecte d'articles.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {correlations.map((c, i) => (
            <div key={i} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{c.note}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {c.sample_size} articles analysés · calculé le {new Date(c.computed_at).toLocaleDateString('fr-CA')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: 22, fontWeight: 500,
                  color: c.coefficient > 0.6 ? 'var(--green-600)' : c.coefficient > 0.3 ? 'var(--amber-400)' : 'var(--text-secondary)',
                }}>
                  {c.coefficient.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>coefficient r</div>
              </div>
              <div style={{ width: 80 }}>
                <div style={{ height: 6, background: 'var(--surface-secondary)', borderRadius: 3 }}>
                  <div style={{
                    width: `${Math.round(Math.abs(c.coefficient) * 100)}%`,
                    height: '100%', borderRadius: 3,
                    background: c.coefficient > 0.6 ? 'var(--green-400)' : c.coefficient > 0.3 ? 'var(--amber-400)' : 'var(--gray-200)',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
