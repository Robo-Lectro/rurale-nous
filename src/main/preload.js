const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Articles
  getArticles: (filters) => ipcRenderer.invoke('get-articles', filters),
  getStats: () => ipcRenderer.invoke('get-stats'),

  // Corrélations
  getCorrelations: () => ipcRenderer.invoke('get-correlations'),

  // Résumé
  generateDigest: () => ipcRenderer.invoke('generate-digest'),

  // Scrape
  scrapeNow: () => ipcRenderer.invoke('scrape-now'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (s) => ipcRenderer.invoke('set-settings', s),

  // Events from main → renderer
  on: (channel, cb) => {
    const allowed = ['scrape-complete', 'digest-ready', 'generate-digest']
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => cb(...args))
    }
  },
  off: (channel, cb) => ipcRenderer.removeListener(channel, cb),
})
