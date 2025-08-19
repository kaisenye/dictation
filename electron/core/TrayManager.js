const { Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const { ICON_PATHS, APP_CONFIG } = require('../utils/Constants.js')

/**
 * TrayManager - Extracted from main.js
 * Handles system tray functionality
 * PRESERVES EXACT FUNCTIONALITY from original main.js createTray()
 */
class TrayManager {
  constructor(windowManager, whisperService, llamaService, dashboardWindowManager) {
    this.tray = null
    this.windowManager = windowManager
    this.whisperService = whisperService
    this.llamaService = llamaService
    this.dashboardWindowManager = dashboardWindowManager
  }

  /**
   * Create system tray
   * EXACT COPY from main.js lines 626-723
   */
  createTray() {
    // Create tray icon with fallback
    let iconPath
    try {
      // In production, try different paths based on app structure
      const possiblePaths = [
        path.join(__dirname, '../public/icon.png'), // Development
        path.join(process.resourcesPath, 'app.asar.unpacked/public/icon.png'), // Production (asar unpacked)
        path.join(process.resourcesPath, 'public/icon.png'), // Production (no asar)
        path.join(__dirname, '../../public/icon.png'), // Alternative structure
        path.join(__dirname, '../public/icon.svg'), // SVG fallback
        path.join(__dirname, '../public/favicon.svg'), // Final fallback
      ]

      iconPath = possiblePaths.find((p) => fs.existsSync(p))

      if (!iconPath) {
        console.warn('No icon found, using default system icon')
        iconPath = null
      } else {
        console.log('Using tray icon:', iconPath)
      }
    } catch (error) {
      console.warn('Icon path resolution failed:', error.message)
      iconPath = null
    }

    try {
      if (iconPath) {
        // Create native image and resize for proper tray display
        const icon = nativeImage.createFromPath(iconPath)

        // Resize to appropriate tray icon size (24x24 for standard, 32x32 for retina)
        const resizedIcon = icon.resize({ width: 24, height: 24 })

        // Set as template image for better macOS integration
        resizedIcon.setTemplateImage(true)

        this.tray = new Tray(resizedIcon)
        console.log('Tray created successfully with resized icon')
      } else {
        // Use a minimal template icon when no file is found
        const templateIcon = nativeImage.createEmpty()
        templateIcon.setTemplateImage(true)
        this.tray = new Tray(templateIcon)
        console.log('Tray created successfully with template icon')
      }
    } catch (error) {
      console.error('Failed to create tray:', error.message)
      return // Don't create tray if it fails completely
    }

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Start Dictation',
        click: async () => {
          const mainWindow = this.windowManager.getWindow()
          if (mainWindow) {
            await this.windowManager.showWindowOnCurrentDesktop()
            mainWindow.webContents.send('tray-start-dictation')
          }
        },
      },
      {
        label: 'Dashboard',
        click: async () => {
          // Open dashboard in separate window
          this.dashboardWindowManager.showDashboard()
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: async () => {
          try {
            // Shutdown AI services first
            await this.whisperService.shutdown()
            await this.llamaService.shutdown()
          } catch (error) {
            console.error('Error shutting down services:', error)
          }

          // Force quit the app
          const { app } = require('electron')
          app.exit(0)
        },
      },
    ])

    this.tray.setContextMenu(contextMenu)
    this.tray.setToolTip(APP_CONFIG.NAME) // Was: 'Romo'

    // Handle tray icon click - always show app
    this.tray.on('click', async () => {
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        await this.windowManager.showWindowOnCurrentDesktop()
      }
    })

    console.log('Tray created successfully')
  }

  /**
   * Destroy tray
   */
  destroyTray() {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
      console.log('Tray destroyed')
    }
  }

  /**
   * Check if tray exists
   */
  hasTray() {
    return !!this.tray
  }
}

module.exports = TrayManager
