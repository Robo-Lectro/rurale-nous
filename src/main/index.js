const { app, BrowserWindow, ipcMain, Menu, shell, Notification } = require('electron')
const path = require('path')
const Store = require('electron-store')
const cron = require('node-cron')

const store = new Store()
const isDev = !app.isPackaged

let mainWindow

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  }
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

function buildMenu() {
  const template = [
    { role: 'appMenu' },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Données',
      submenu: [
        {
          label: 'Actualiser maintenant',
          accelerator: 'CmdOrCtrl+R',
          click: () => triggerScrape(),
        },
        {
          label: 'Générer résumé 8 min',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow?.webContents.send('generate-digest'),
        },
        { type: 'separator' },
        {
          label: 'Ouvrir dossier données',
          click: () => shell.openPath(path.join(app.getPath('userData'), 'data')),
        },
      ],
    },
    { role: 'help' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('get-articles', async (_, filters) => {
  const db = require('../services/db')
  return db.getArticles(filters)
})

ipcMain.handle('get-stats', async () => {
  const db = require('../services/db')
  return db.getStats()
})

ipcMain.handle('get-correlations', async () => {
  const correlator = require('../services/correlator')
  return correlator.getCorrelations()
})

ipcMain.handle('generate-digest', async () => {
  const digest = require('../services/digest')
  return digest.generate()
})

ipcMain.handle('get-settings', () => store.store)
ipcMain.handle('set-settings', (_, settings) => {
  store.set(settings)
  return true
})

ipcMain.handle('scrape-now', async () => {
  return triggerScrape()
})

// ─── Scrape scheduler ────────────────────────────────────────────────────────

async function triggerScrape() {
  try {
    const scraper = require('../services/scraper')
    const results = await scraper.scrapeAll()
    mainWindow?.webContents.send('scrape-complete', results)
    if (results.newArticles > 0) {
      new Notification({
        title: 'Rurale-Nous',
        body: `${results.newArticles} nouveau${results.newArticles > 1 ? 'x' : ''} article${results.newArticles > 1 ? 's' : ''} collecté${results.newArticles > 1 ? 's' : ''}`,
      }).show()
    }
    return results
  } catch (err) {
    console.error('Scrape error:', err)
    return { error: err.message }
  }
}

// Toutes les heures
cron.schedule('0 * * * *', triggerScrape)
// Résumé automatique chaque lundi à 7h
cron.schedule('0 7 * * 1', async () => {
  const digest = require('../services/digest')
  await digest.generate()
  mainWindow?.webContents.send('digest-ready')
})

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  buildMenu()

  // Premier scrape au démarrage (délai 3 s pour laisser l'UI se charger)
  setTimeout(triggerScrape, 3000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
