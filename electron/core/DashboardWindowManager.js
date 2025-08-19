const { BrowserWindow } = require('electron')
const path = require('path')
const { APP_CONFIG } = require('../utils/Constants.js')

/**
 * DashboardWindowManager - Handles the separate dashboard window
 * This is completely separate from the main pill window
 */
class DashboardWindowManager {
  constructor() {
    this.dashboardWindow = null
  }

  /**
   * Create the dashboard window
   */
  createDashboardWindow() {
    // Don't create multiple dashboard windows
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      this.dashboardWindow.focus()
      return this.dashboardWindow
    }

    const isDev = process.env.IS_DEV === 'true'
    const { app } = require('electron')

    // Create a normal-sized window for the dashboard
    this.dashboardWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: isDev
          ? path.join(__dirname, '..', 'preload.js')
          : path.join(app.getAppPath(), 'dist-electron', 'preload.js'),
        webSecurity: true,
      },
      show: false, // Don't show until ready
      icon: path.join(__dirname, '../../public/icon.png'),
      title: 'Dashboard - Romo',
      titleBarStyle: 'default',
      frame: true,
      transparent: false,
      movable: true,
      hasShadow: true,
      alwaysOnTop: false,
      visibleOnAllWorkspaces: false,
      focusable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      center: true,
    })

    // Load the dashboard HTML file
    if (isDev) {
      // In development, use main vite server with dashboard mode
      const dashboardUrl = `${APP_CONFIG.DEV_SERVER_URL}/#dashboard`
      console.log('Loading dashboard from:', dashboardUrl)
      this.dashboardWindow.loadURL(dashboardUrl)
    } else {
      // In production, load the dashboard HTML file
      const dashboardPath = path.join(app.getAppPath(), 'dist', 'dashboard.html')
      console.log('Loading dashboard from:', dashboardPath)
      this.dashboardWindow.loadFile(dashboardPath)
    }

    // Show window when ready
    this.dashboardWindow.once('ready-to-show', () => {
      this.dashboardWindow.show()
      this.dashboardWindow.focus()
      
      // Open dev tools for debugging in development
      if (isDev) {
        this.dashboardWindow.webContents.openDevTools()
      }
    })

    // Handle window closed
    this.dashboardWindow.on('closed', () => {
      this.dashboardWindow = null
    })

    // Handle load failures
    this.dashboardWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Dashboard failed to load:', errorCode, errorDescription, validatedURL)
    })

    // Handle navigation errors
    this.dashboardWindow.webContents.on('did-finish-load', () => {
      console.log('Dashboard finished loading')
    })

    // Handle external links
    this.dashboardWindow.webContents.setWindowOpenHandler(({ url }) => {
      const { shell } = require('electron')
      shell.openExternal(url)
      return { action: 'deny' }
    })

    return this.dashboardWindow
  }

  /**
   * Show or focus existing dashboard window
   */
  showDashboard() {
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      if (this.dashboardWindow.isMinimized()) {
        this.dashboardWindow.restore()
      }
      this.dashboardWindow.focus()
    } else {
      this.createDashboardWindow()
    }
  }

  /**
   * Close dashboard window
   */
  closeDashboard() {
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      this.dashboardWindow.close()
    }
  }

  /**
   * Get the dashboard window instance
   */
  getDashboardWindow() {
    return this.dashboardWindow
  }

  /**
   * Check if dashboard window exists and is visible
   */
  isDashboardVisible() {
    return this.dashboardWindow && !this.dashboardWindow.isDestroyed() && this.dashboardWindow.isVisible()
  }
}

module.exports = DashboardWindowManager
