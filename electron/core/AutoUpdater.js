const { autoUpdater } = require('electron-updater')
const { dialog } = require('electron')
const log = require('electron-log')

class AutoUpdater {
  constructor(windowManager) {
    this.windowManager = windowManager
    this.updateInProgress = false

    // Configure logging
    autoUpdater.logger = log
    autoUpdater.logger.transports.file.level = 'info'

    // Set up event handlers
    this.setupEventHandlers()
  }

  setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...')
      this.sendToRenderer('update-checking')
    })

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info.version)
      this.updateInProgress = true
      this.showUpdateDialog(info)
    })

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available')
      this.sendToRenderer('update-not-available')
    })

    autoUpdater.on('error', (err) => {
      log.error('Update error:', err)
      this.updateInProgress = false
      this.sendToRenderer('update-error', err.message)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      log.info(`Download progress: ${progressObj.percent}%`)
      this.sendToRenderer('download-progress', {
        percent: Math.round(progressObj.percent),
        transferred: progressObj.transferred,
        total: progressObj.total,
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded')
      this.updateInProgress = false
      this.sendToRenderer('update-downloaded')
      this.showRestartDialog(info)
    })
  }

  sendToRenderer(event, data) {
    const mainWindow = this.windowManager.getWindow()
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send(event, data)
    }
  }

  async showUpdateDialog(info) {
    const mainWindow = this.windowManager.getWindow()
    if (!mainWindow) return

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version of Romo is available!`,
      detail: `Version ${info.version} is ready to download. Would you like to download it now?`,
      buttons: ['Download Now', 'Download Later'],
      defaultId: 0,
      cancelId: 1,
    })

    if (result.response === 0) {
      log.info('User chose to download update')
      this.sendToRenderer('update-downloading')
      autoUpdater.downloadUpdate()
    } else {
      log.info('User chose to download later')
      this.updateInProgress = false
    }
  }

  async showRestartDialog(info) {
    const mainWindow = this.windowManager.getWindow()
    if (!mainWindow) return

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update has been downloaded successfully!',
      detail: `Version ${info.version} is ready to install. The application will restart to complete the update.`,
      buttons: ['Restart Now', 'Restart Later'],
      defaultId: 0,
      cancelId: 1,
    })

    if (result.response === 0) {
      log.info('User chose to restart now')
      autoUpdater.quitAndInstall()
    } else {
      log.info('User chose to restart later')
    }
  }

  checkForUpdates() {
    // Only check for updates in production
    if (process.env.IS_DEV === 'development') {
      log.info('Skipping update check in development mode')
      return
    }

    if (this.updateInProgress) {
      log.info('Update already in progress, skipping check')
      return
    }

    log.info('Checking for updates...')
    autoUpdater.checkForUpdatesAndNotify()
  }

  checkForUpdatesManually() {
    // Force check even if one is in progress
    log.info('Manual update check triggered')
    autoUpdater.checkForUpdatesAndNotify()
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall()
  }
}

module.exports = AutoUpdater
