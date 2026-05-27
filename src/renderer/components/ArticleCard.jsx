import React from 'react'

const THEME_COLORS = {
  transport: { bg: 'var(--blue-50)', text: 'var(--blue-600)', label: 'Transport' },
  developpement: { bg: 'var(--purple-50)', text: 'var(--purple-600)', label: 'Développement' },
  defi_rural: { bg: 'var(--amber-50)', text: 'var(--amber-600)', label: 'Défi rural' },
  bonne_pratique: { bg: 'var(--green-50)', text: 'var(--green-600)', label: 'Bonne pratique' },
  environnement: { bg: 'var(--teal-50)', text: 'var(--teal-600)', label: 'Environnement' },
  sante: { bg: 'var(--coral-50)', text: 'var(--coral-600)', label: 'Santé' },
  logement: { bg: '#F5F0FB', text: '#6B52AE', label: 'Logement' },
  economie: { bg: 'var(--gray-50)', text: 'var(--gray-600)', label: 'Économie' },
}

const SOURCE_COLORS = {
  rimq: { bg: 'var(--coral-50)', text: 'var(--coral-600)', border: 'var(--coral-50)' },
  umq: { bg: 'var(--purple-50)', text: 'var(--purple-600)', border: 'var(--purple-50)' },
  fqm: { bg: 'var(--teal-50)', text: 'var(--teal-600)', border: 'var(--teal-50)' },
  media: { bg: 'var(--gray-50)', text: 'var(--gray-600)', border: 'var(--gray-50)' },
}

export default function ArticleCard({ article }) {
  const readMin = article.read_time_s ? Math.max(1, Math.round(article.read_time_s / 60)) : null
  const sourceColor = SOURCE_COLORS[article.source_type] || SOURCE_COLORS.media

  function openArticle() {
    if (article.url) {
      window.api?.openExternal(article.url) || window.open(article.url, '_blank')
    }
  }

  return (
    <div
      onClick={openArticle}
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        cursor: article.url ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Badges */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
        {(article.themes || []).slice(0, 3).map(t => {
          const c = THEME_COLORS[t]
          if (!c) return null
          return (
            <span key={t} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500,
              background: c.bg, color: c.text,
            }}>
              {c.label}
            </span>
          )
        })}
        {article.is_good_practice ? (
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500,
            background: 'var(--green-50)', color: 'var(--green-600)',
            border: '0.5px solid var(--green-100)',
          }}>
            ★ Bonne pratique
          </span>
        ) : null}
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500,
          background: sourceColor.bg, color: sourceColor.text,
          border: `0.5px solid ${sourceColor.bg}`,
          marginLeft: 'auto',
        }}>
          {article.source_type?.toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>
        {article.title}
      </div>

      {/* Snippet */}
      {article.snippet && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 10 }}>
          {article.snippet.slice(0, 220)}{article.snippet.length > 220 ? '…' : ''}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingTop: 10, borderTop: '0.5px solid var(--border)',
        fontSize: 11, color: 'var(--text-tertiary)',
      }}>
        <span style={{
          background: 'var(--surface-secondary)', padding: '1px 7px', borderRadius: 4,
        }}>
          {article.source}
        </span>
        {article.region && (
          <span>{article.region}</span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          {readMin && `${readMin} min`}
        </span>
      </div>

      {/* Read time bar */}
      {readMin && (
        <div style={{ marginTop: 8, height: 2, background: 'var(--surface-secondary)', borderRadius: 1 }}>
          <div style={{
            width: `${Math.min(100, Math.round((readMin / 8) * 100))}%`,
            height: '100%', background: 'var(--green-400)', borderRadius: 1,
          }} />
        </div>
      )}
    </div>
  )
}
