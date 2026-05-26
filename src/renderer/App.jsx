import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './views/Dashboard'
import Articles from './views/Articles'
import Correlations from './views/Correlations'
import Digest from './views/Digest'
import Settings from './views/Settings'

const VIEWS = {
  dashboard: Dashboard,
  articles: Articles,
  correlations: Correlations,
  digest: Digest,
  settings: Settings,
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [scrapeStatus, setScrapeStatus] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()

    // Écouter les events du main process
    window.api?.on('scrape-complete', (result) => {
      setScrapeStatus(result)
      loadStats()
    })
    window.api?.on('digest-ready', () => {
      setView('digest')
    })
  }, [])

  async function loadStats() {
    const s = await window.api?.getStats()
    if (s) setStats(s)
  }

  const View = VIEWS[view] || Dashboard

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      <Sidebar
        activeView={view}
        onNavigate={setView}
        stats={stats}
        scrapeStatus={scrapeStatus}
      />
      <main style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        <View stats={stats} onStatsChange={loadStats} />
      </main>
    </div>
  )
}
