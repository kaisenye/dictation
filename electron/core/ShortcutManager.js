const { globalShortcut } = require('electron')
const { SHORTCUTS } = require('../utils/Constants.js')

/**
 * ShortcutManager - Extracted from main.js
 * Handles all global shortcuts and keyboard events
 * PRESERVES EXACT FUNCTIONALITY from original main.js registerGlobalShortcuts()
 */
class ShortcutManager {
  constructor(windowManager) {
    this.windowManager = windowManager
    this.isRecording = false // Simple recording state from main.js line 545
  }

  /**
   * Register all global shortcuts
   * EXACT COPY from main.js lines 548-624
   */
  registerGlobalShortcuts() {
    // Unregister any existing shortcuts first
    globalShortcut.unregisterAll()

    // SIMPLE SOLUTION: Pure toggle
    // Press once = start recording
    // Press again = stop recording
    const toggleSuccess = globalShortcut.register(SHORTCUTS.TOGGLE_DICTATION, async () => {
      console.log('=== Cmd+Shift+D pressed ===')

      const mainWindow = this.windowManager.getWindow()
      if (!mainWindow) return

      if (!this.isRecording) {
        // Start recording
        console.log('Starting recording')
        this.isRecording = true
        mainWindow.webContents.send('global-shortcut-start-recording')
      } else {
        // Stop recording
        console.log('Stopping recording')
        this.isRecording = false
        mainWindow.webContents.send('global-shortcut-stop-recording')
      }
    })

    if (!toggleSuccess) {
      console.log('Failed to register Cmd+Shift+D shortcut')
    } else {
      console.log('Successfully registered Cmd+Shift+D - press to start, press again to stop')
    }

    // Copy transcription
    const copySuccess = globalShortcut.register(SHORTCUTS.COPY_TRANSCRIPTION, () => {
      console.log('Global shortcut CmdOrCtrl+Shift+C pressed')
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        mainWindow.webContents.send('global-shortcut-copy-transcription')
      }
    })

    if (!copySuccess) {
      console.log('Failed to register CmdOrCtrl+Shift+C shortcut')
    }

    // Show/hide app
    const showHideSuccess = globalShortcut.register(SHORTCUTS.SHOW_HIDE_APP, async () => {
      console.log('Global shortcut CmdOrCtrl+Shift+H pressed')
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          await this.windowManager.showWindowOnCurrentDesktop()
        }
      }
    })

    if (!showHideSuccess) {
      console.log('Failed to register CmdOrCtrl+Shift+H shortcut')
    }

    // Toggle agent mode
    const agentModeSuccess = globalShortcut.register(SHORTCUTS.TOGGLE_AGENT_MODE, () => {
      console.log('🚀 Global shortcut CmdOrCtrl+Shift+S pressed - Toggle Agent Mode')
      const mainWindow = this.windowManager.getWindow()
      if (mainWindow) {
        console.log('📡 Sending global-shortcut-toggle-agent-mode event to renderer')
        mainWindow.webContents.send('global-shortcut-toggle-agent-mode')
        console.log('✅ Event sent successfully')
      } else {
        console.log('❌ mainWindow is null, cannot send event')
      }
    })

    if (!agentModeSuccess) {
      console.log('Failed to register CmdOrCtrl+Shift+S shortcut')
    }

    console.log('Global shortcuts registered successfully')
  }

  /**
   * Unregister all global shortcuts
   */
  unregisterGlobalShortcuts() {
    globalShortcut.unregisterAll()
    console.log('Global shortcuts unregistered')
  }

  /**
   * Get current recording state
   */
  getRecordingState() {
    return this.isRecording
  }

  /**
   * Set recording state (for external state management)
   */
  setRecordingState(isRecording) {
    this.isRecording = isRecording
  }

  /**
   * Check if shortcuts are registered
   */
  areShortcutsRegistered() {
    return globalShortcut.isRegistered(SHORTCUTS.TOGGLE_DICTATION)
  }
}

module.exports = ShortcutManager