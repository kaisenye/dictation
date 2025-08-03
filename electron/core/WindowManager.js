const { BrowserWindow } = require('electron')
const path = require('path')
const { WINDOW_CONFIG, APP_CONFIG, CSP } = require('../utils/Constants.js')
const AnimationUtils = require('../utils/AnimationUtils.js')

/**
 * WindowManager - Extracted from main.js
 * Handles all window operations, positioning, and animations
 * PRESERVES EXACT FUNCTIONALITY from original main.js
 */
class WindowManager {
  constructor() {
    this.mainWindow = null
  }

  /**
   * Get bottom center position for window - always return pill size position
   * EXACT COPY from main.js lines 12-32
   */
  getBottomCenterPosition() {
    const { screen } = require('electron')
    const cursorPosition = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(cursorPosition)

    const windowWidth = WINDOW_CONFIG.PILL.WIDTH // Was: 60
    const windowHeight = WINDOW_CONFIG.PILL.HEIGHT // Was: 20
    const margin = WINDOW_CONFIG.MARGIN // Was: 40

    // Calculate bottom center position
    const x = Math.floor((display.workAreaSize.width - windowWidth) / 2) + display.workArea.x
    const y = display.workArea.y + display.workAreaSize.height - windowHeight - margin

    return {
      x: Math.max(display.workArea.x, Math.min(x, display.workArea.x + display.workAreaSize.width - windowWidth)),
      y: Math.max(
        display.workArea.y,
        Math.min(y, display.workArea.y + display.workAreaSize.height - windowHeight - margin)
      ),
    }
  }

  /**
   * Helper function to show window on current desktop
   * EXACT COPY from main.js lines 35-60
   */
  async showWindowOnCurrentDesktop() {
    if (this.mainWindow) {
      // If window is already visible, just focus it
      if (this.mainWindow.isVisible()) {
        this.mainWindow.focus()
        return
      }

      // First ensure the window is visible on all workspaces
      if (process.platform === 'darwin') {
        this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      }

      // Always position at bottom center (ignore saved position)
      const position = this.getBottomCenterPosition()
      this.mainWindow.setPosition(position.x, position.y)
      console.log('Window positioned at bottom center:', position)

      // Ensure window stays on top
      this.mainWindow.setAlwaysOnTop(true)

      // Show and focus the window
      this.mainWindow.show()
      this.mainWindow.focus()
    }
  }

  /**
   * Create the main browser window
   * EXACT COPY from main.js lines 62-153
   */
  createWindow() {
    const isDev = process.env.IS_DEV === 'true'
    
    // Create the browser window - tiny pill that expands during recording
    this.mainWindow = new BrowserWindow({
      width: WINDOW_CONFIG.PILL.WIDTH, // Was: 60
      height: WINDOW_CONFIG.PILL.HEIGHT, // Was: 20
      minWidth: WINDOW_CONFIG.PILL.MIN_WIDTH, // Was: 60
      minHeight: WINDOW_CONFIG.PILL.MIN_HEIGHT, // Was: 20
      maxWidth: WINDOW_CONFIG.EXPANDED.MAX_WIDTH, // Was: 260
      maxHeight: WINDOW_CONFIG.EXPANDED.MAX_HEIGHT, // Was: 60
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../preload.js'),
        webSecurity: true,
      },
      show: false, // Don't show until ready
      icon: path.join(__dirname, '../../public/icon.png'),
      resizable: false, // Disable resizing to maintain fixed size
      skipTaskbar: true, // Don't show in taskbar/dock
      frame: false, // Remove all window controls including close/expand buttons
      transparent: false, // Disable transparency for solid window
      movable: false, // Prevent moving to keep it centered
      hasShadow: false, // Remove shadow for minimal appearance
      alwaysOnTop: true, // Keep window on top of all other applications
      visibleOnAllWorkspaces: true, // Make window visible on all desktops/spaces
      focusable: false, // Prevent window from stealing focus
      minimizable: false, // Remove minimize button
      maximizable: false, // Remove maximize button
      closable: false, // Remove close button (controlled by shortcut only)
      roundedCorners: true, // Enable rounded corners for pill shape
    })

    // Set Content Security Policy
    this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            `default-src ${CSP.DEFAULT_SRC}; ` +
              `script-src ${CSP.SCRIPT_SRC}; ` +
              `style-src ${CSP.STYLE_SRC}; ` +
              `font-src ${CSP.FONT_SRC}; ` +
              `img-src ${CSP.IMG_SRC}; ` +
              `connect-src ${CSP.CONNECT_SRC};`,
          ],
        },
      })
    })

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL(APP_CONFIG.DEV_SERVER_URL) // Was: 'http://localhost:5173'
      // Open dev tools for debugging
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(path.join(__dirname, APP_CONFIG.DIST_PATH)) // Was: '../dist/index.html'
    }

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      // Show immediately in pill mode at bottom center
      const position = this.getBottomCenterPosition()
      this.mainWindow.setPosition(position.x, position.y)
      this.mainWindow.show()

      // Ensure window appears on current desktop when shown
      if (process.platform === 'darwin') {
        this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      }
    })

    // Handle window closed
    this.mainWindow.on('closed', async () => {
      this.mainWindow = null
      // Emit event for main.js to handle service shutdown
      this.emit('window-closed')
    })

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      const { shell } = require('electron')
      shell.openExternal(url)
      return { action: 'deny' }
    })

    return this.mainWindow
  }

  /**
   * Window expansion for recording with spring animation
   * Refactored to use AnimationUtils
   */
  async expandWindowForRecording() {
    if (!this.mainWindow) {
      return { success: false, error: 'No window available' }
    }

    const position = this.getBottomCenterPosition()
    const fromSize = {
      width: 50, // Start width
      height: WINDOW_CONFIG.PILL.HEIGHT
    }
    const toSize = {
      width: WINDOW_CONFIG.EXPANDED.WIDTH,
      height: WINDOW_CONFIG.EXPANDED.HEIGHT
    }

    return await AnimationUtils.expandWindow(
      this.mainWindow,
      fromSize,
      toSize,
      position,
      {
        duration: WINDOW_CONFIG.ANIMATION.EXPAND_DURATION,
        steps: WINDOW_CONFIG.ANIMATION.EXPAND_STEPS
      }
    )
  }

  /**
   * Shrink window back to pill size
   * Refactored to use AnimationUtils
   */
  async shrinkWindowToPill() {
    if (!this.mainWindow) {
      return { success: false, error: 'No window available' }
    }

    const targetPosition = this.getBottomCenterPosition()
    const currentBounds = this.mainWindow.getBounds()
    const targetSize = {
      width: WINDOW_CONFIG.PILL.WIDTH,
      height: WINDOW_CONFIG.PILL.HEIGHT
    }

    return await AnimationUtils.shrinkWindow(
      this.mainWindow,
      currentBounds,
      targetSize,
      targetPosition,
      {
        duration: WINDOW_CONFIG.ANIMATION.SHRINK_DURATION,
        steps: WINDOW_CONFIG.ANIMATION.SHRINK_STEPS
      }
    )
  }

  /**
   * Standard window operations
   */
  minimizeWindow() {
    if (this.mainWindow) this.mainWindow.minimize()
  }

  maximizeWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize()
      } else {
        this.mainWindow.maximize()
      }
    }
  }

  closeWindow() {
    if (this.mainWindow) this.mainWindow.close()
  }

  /**
   * Get the main window instance
   */
  getWindow() {
    return this.mainWindow
  }

  /**
   * Check if window exists and is visible
   */
  isVisible() {
    return this.mainWindow && this.mainWindow.isVisible()
  }
}

// Make WindowManager an EventEmitter for window-closed events
const { EventEmitter } = require('events')
Object.setPrototypeOf(WindowManager.prototype, EventEmitter.prototype)

module.exports = WindowManager