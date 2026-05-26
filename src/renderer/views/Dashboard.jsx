import React, { useState, useEffect } from 'react'
import ArticleCard from '../components/ArticleCard'

export default function Dashboard({ stats }) {
  const [articles, setArticles] = useState([])
  const [correlations, setCorrelations] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const a = await window.api?.getArticles({ limit: 5 })
    if (a) setArticles(a)
    const c = await window.api?.getCorrelations()
    if (c) setCorrelations(c)
  }

  async function generateDigest() {
    const result = await window.api?.generateDigest()
    if (result?.error) alert(result.error)
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Veille rurale du Québec — {new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={generateDigest}
          style={{
            marginLeft: 'auto', padding: '8px 16px', fontSize: 13,
            background: 'var(--green-600)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500,
          }}
        >
          Générer résumé 8 min
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Articles collectés" value={stats.totalArticles} delta={`+${stats.todayArticles} aujourd'hui`} deltaPositive />
          <StatCard label="Articles aujourd'hui" value={stats.todayArticles} />
          <StatCard label="Bonnes pratiques" value={stats.goodPractices} deltaPositive />
          <StatCard label="Régions actives" value={stats.activeRegions} />
        </div>
      )}

      {/* Corrélations */}
      {correlations.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Corrélations détectées</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {correlations.slice(0, 3).map((c, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '12px 14px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{c.note}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  r = {c.coefficient} · {c.sample_size} articles
                </div>
                <CorrBar value={c.coefficient} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles récents */}
      <div>
        <SectionTitle>Articles récents</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {articles.length === 0 ? (
            <div style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 32, textAlign: 'center',
              color: 'var(--text-tertiary)', fontSize: 14,
            }}>
              Aucun article pour l'instant. L'application collecte automatiquement les actualités toutes les heures.
            </div>
          ) : (
            articles.map(a => <ArticleCard key={a.id} article={a} />)
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, delta, deltaPositive }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500 }}>{value ?? '—'}</div>
      {delta && (
        <div style={{ fontSize: 10, marginTop: 2, color: deltaPositive ? 'var(--green-600)' : 'var(--text-tertiary)' }}>
          {delta}
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: 'var(--text-secondary)' }}>
      {children}
    </div>
  )
}

function CorrBar({ value }) {
  const pct = Math.round(Math.abs(value) * 100)
  return (
    <div style={{ marginTop: 8, height: 3, background: 'var(--surface-secondary)', borderRadius: 2 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green-400)', borderRadius: 2 }} />
    </div>
  )
}
