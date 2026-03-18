import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateStatus } from '@shared/types'

export function initAutoUpdater(win: BrowserWindow): void {
  // Only run in production
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  function send(status: UpdateStatus): void {
    win.webContents.send('updater:status', status)
  }

  autoUpdater.on('checking-for-update', () => send({ kind: 'checking' }))

  autoUpdater.on('update-available', (info) =>
    send({ kind: 'available', version: info.version })
  )

  autoUpdater.on('update-not-available', () => send({ kind: 'not-available' }))

  autoUpdater.on('download-progress', (progress) =>
    send({ kind: 'downloading', percent: Math.round(progress.percent) })
  )

  autoUpdater.on('update-downloaded', (info) =>
    send({ kind: 'downloaded', version: info.version })
  )

  autoUpdater.on('error', (err) =>
    send({ kind: 'error', message: err.message })
  )

  // IPC: renderer triggers quit-and-install
  ipcMain.handle('updater:quitAndInstall', () => {
    autoUpdater.quitAndInstall()
  })

  // Check for updates 3 seconds after startup to avoid blocking launch
  setTimeout(() => {
    void autoUpdater.checkForUpdates()
  }, 3000)
}
