import React, { useState, useEffect } from 'react'

export function Digest() {
  const [digest, setDigest] = useState(null)
  const [generating, setGenerating] = useState(false)

  async function generate() {
    setGenerating(true)
    const result = await window.api?.generateDigest()
    if (result && !result.error) setDigest(result)
    else if (result?.error) alert(result.error)
    setGenerating(false)
  }

  const readMin = digest ? Math.round(digest.read_time_s / 60) : 0

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px', marginBottom: 4 }}>Résumé 8 minutes</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Généré par Groq · actualités rurales du Québec</p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          style={{
            marginLeft: 'auto', padding: '8px 16px', fontSize: 13,
            background: generating ? 'var(--surface-secondary)' : 'var(--green-600)',
            color: generating ? 'var(--text-tertiary)' : 'white',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: generating ? 'default' : 'pointer', fontWeight: 500,
          }}
        >
          {generating ? 'Génération en cours...' : 'Générer un nouveau résumé'}
        </button>
      </div>

      {!digest ? (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center',
          color: 'var(--text-tertiary)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Aucun résumé généré</div>
          <div style={{ fontSize: 12 }}>Cliquez sur "Générer" pour créer votre résumé hebdomadaire.</div>
          <div style={{ fontSize: 11, marginTop: 8 }}>Nécessite une clé API Groq (Préférences)</div>
        </div>
      ) : (
        <div>
          <div style={{
            background: 'var(--green-50)', border: '0.5px solid var(--green-100)',
            borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
          }}>
            <span style={{ color: 'var(--green-600)', fontWeight: 500 }}>⏱ {readMin} min de lecture</span>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span style={{ color: 'var(--text-secondary)' }}>Semaine du {digest.week_label}</span>
          </div>
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px 28px',
            fontSize: 14, lineHeight: 1.75, color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}>
            {digest.content}
          </div>
        </div>
      )}
    </div>
  )
}

export function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api?.getSettings().then(s => {
      if (s?.groqApiKey) setApiKey(s.groqApiKey)
    })
  }, [])

  async function save() {
    await window.api?.setSettings({ groqApiKey: apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px', marginBottom: 24 }}>Préférences</h1>

      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Clé API Groq
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="gsk_..."
            style={{
              width: '100%', padding: '9px 12px', fontSize: 13,
              background: 'var(--surface-secondary)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
            Nécessaire pour générer les résumés 8 minutes. Obtenir une clé sur console.groq.com
          </p>
        </div>

        <button
          onClick={save}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 500,
            background: saved ? 'var(--green-600)' : 'var(--surface-secondary)',
            color: saved ? 'white' : 'var(--text-primary)',
            border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}
        >
          {saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default Digest
