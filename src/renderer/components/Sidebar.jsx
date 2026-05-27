import React from 'react'

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '⬛' },
  { id: 'articles', label: 'Actualités', icon: '📰' },
  { id: 'correlations', label: 'Corrélations', icon: '🔗' },
  { id: 'digest', label: 'Résumé 8 min', icon: '📄' },
]

const THEMES = [
  { id: 'transport', label: 'Transport collectif' },
  { id: 'developpement', label: 'Développement' },
  { id: 'defi_rural', label: 'Défis ruraux' },
  { id: 'bonne_pratique', label: 'Bonnes pratiques' },
]

const SOURCES = [
  { id: 'rimq', label: 'RIMQ', color: 'var(--coral-400)' },
  { id: 'umq', label: 'UMQ', color: 'var(--purple-400)' },
  { id: 'fqm', label: 'FQM', color: 'var(--teal-400)' },
]

export default function Sidebar({ activeView, onNavigate, stats, scrapeStatus }) {
  async function handleScrape() {
    await window.api?.scrapeNow()
  }

  return (
    <nav style={{
      width: 210,
      background: 'var(--surface)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 0',
      flexShrink: 0,
      // Espace pour la barre de titre macOS
      paddingTop: 44,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 16px 16px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' }}>
          <span style={{ color: 'var(--green-600)' }}>Rurale</span>
          <span style={{ color: 'var(--text-primary)' }}>-Nious</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Veille municipale QC
        </div>
      </div>

      {/* Navigation principale */}
      <div style={{ padding: '12px 0' }}>
        <SectionTitle>Navigation</SectionTitle>
        {NAV.map(item => (
          <NavItem
            key={item.id}
            active={activeView === item.id}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
            {item.id === 'articles' && stats?.todayArticles > 0 && (
              <Badge>{stats.todayArticles}</Badge>
            )}
          </NavItem>
        ))}
      </div>

      {/* Thèmes */}
      <div style={{ padding: '0 0 8px' }}>
        <SectionTitle>Thèmes</SectionTitle>
        {THEMES.map(t => (
          <NavItem key={t.id} onClick={() => onNavigate('articles')}>
            {t.label}
          </NavItem>
        ))}
      </div>

      {/* Sources */}
      <div style={{ padding: '0 0 8px' }}>
        <SectionTitle>Sources</SectionTitle>
        {SOURCES.map(s => (
          <NavItem key={s.id} onClick={() => onNavigate('articles')}>
            <span style={{
              display: 'inline-block', width: 7, height: 7,
              borderRadius: '50%', background: s.color, marginRight: 6,
            }} />
            {s.label}
          </NavItem>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '0.5px solid var(--border)' }}>
        <button
          onClick={handleScrape}
          style={{
            width: '100%', padding: '7px', fontSize: 12,
            background: 'var(--green-50)', color: 'var(--green-600)',
            border: '0.5px solid var(--green-100)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontWeight: 500,
          }}
        >
          ↻ Actualiser maintenant
        </button>

        {scrapeStatus && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, textAlign: 'center' }}>
            {scrapeStatus.error
              ? `Erreur: ${scrapeStatus.error}`
              : scrapeStatus.newArticles > 0
                ? `+${scrapeStatus.newArticles} nouveaux articles`
                : 'Aucun nouvel article'}
            {scrapeStatus.bySource?.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {scrapeStatus.bySource
                  .map(s => `${s.source}: ${s.found}${s.newArticles ? ` (+${s.newArticles})` : ''}`)
                  .join(' · ')}
              </div>
            )}
            {scrapeStatus.errors?.length > 0 && (
              <div style={{ marginTop: 4, color: 'var(--coral-600)' }}>
                {scrapeStatus.errors.length} source{scrapeStatus.errors.length > 1 ? 's' : ''} en erreur
              </div>
            )}
          </div>
        )}

        <NavItem onClick={() => onNavigate('settings')} style={{ marginTop: 4, padding: '6px 0' }}>
          ⚙ Préférences
        </NavItem>
      </div>
    </nav>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 500, color: 'var(--text-tertiary)',
      letterSpacing: '0.7px', textTransform: 'uppercase',
      padding: '4px 16px 2px',
    }}>
      {children}
    </div>
  )
}

function NavItem({ children, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '7px 16px', fontSize: 13,
        color: active ? 'var(--green-600)' : 'var(--text-secondary)',
        background: active ? 'var(--green-50)' : 'transparent',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => !active && (e.currentTarget.style.background = 'var(--surface-secondary)')}
      onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </div>
  )
}

function Badge({ children }) {
  return (
    <span style={{
      marginLeft: 'auto', background: 'var(--green-600)',
      color: 'var(--green-50)', fontSize: 10,
      padding: '1px 6px', borderRadius: 10, fontWeight: 500,
    }}>
      {children}
    </span>
  )
}
