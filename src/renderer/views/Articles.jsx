import React, { useState, useEffect } from 'react'
import ArticleCard from '../components/ArticleCard'

const THEMES = [
  { id: null, label: 'Tous' },
  { id: 'transport', label: 'Transport' },
  { id: 'developpement', label: 'Développement' },
  { id: 'defi_rural', label: 'Défis ruraux' },
  { id: 'bonne_pratique', label: 'Bonnes pratiques' },
  { id: 'environnement', label: 'Environnement' },
  { id: 'sante', label: 'Santé' },
]

const SOURCE_TYPES = [
  { id: null, label: 'Toutes les sources' },
  { id: 'rimq', label: 'RIMQ' },
  { id: 'umq', label: 'UMQ' },
  { id: 'fmq', label: 'FMQ' },
  { id: 'media', label: 'Médias' },
]

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(null)
  const [sourceType, setSourceType] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [theme, sourceType])

  async function load() {
    setLoading(true)
    const data = await window.api?.getArticles({ theme, sourceType, limit: 100 })
    setArticles(data || [])
    setLoading(false)
  }

  const filtered = search
    ? articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.snippet?.toLowerCase().includes(search.toLowerCase())
      )
    : articles

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px', marginBottom: 4 }}>Actualités</h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''} · Régions rurales du Québec
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Chercher dans les articles..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '9px 14px', fontSize: 13,
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
          marginBottom: 14, outline: 'none',
        }}
      />

      {/* Theme filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              padding: '4px 12px', fontSize: 12, cursor: 'pointer',
              borderRadius: 20, border: '0.5px solid',
              borderColor: theme === t.id ? 'var(--green-200)' : 'var(--border)',
              background: theme === t.id ? 'var(--green-50)' : 'var(--surface)',
              color: theme === t.id ? 'var(--green-600)' : 'var(--text-secondary)',
              fontWeight: theme === t.id ? 500 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Source filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {SOURCE_TYPES.map(s => (
          <button
            key={s.id}
            onClick={() => setSourceType(s.id)}
            style={{
              padding: '3px 10px', fontSize: 11, cursor: 'pointer',
              borderRadius: 20, border: '0.5px solid',
              borderColor: sourceType === s.id ? 'var(--border-strong)' : 'var(--border)',
              background: sourceType === s.id ? 'var(--surface-secondary)' : 'var(--surface)',
              color: sourceType === s.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: sourceType === s.id ? 500 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center',
          color: 'var(--text-tertiary)', fontSize: 14,
        }}>
          Aucun article trouvé avec ces filtres.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  )
}
