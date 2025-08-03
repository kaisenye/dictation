/**
 * PermissionManager - Extracted from main.js
 * Handles system permissions requests
 * PRESERVES EXACT FUNCTIONALITY from original main.js requestPermissions()
 */
class PermissionManager {
  /**
   * Request system permissions
   * EXACT COPY from main.js lines 725-754
   */
  static async requestPermissions() {
    if (process.platform === 'darwin') {
      const { systemPreferences } = require('electron')

      try {
        // Request microphone permission
        const micStatus = systemPreferences.getMediaAccessStatus('microphone')
        console.log('Microphone permission status:', micStatus)

        if (micStatus !== 'granted') {
          console.log('Requesting microphone permission...')
          const granted = await systemPreferences.askForMediaAccess('microphone')
          console.log('Microphone permission granted:', granted)
        }

        // Check accessibility permission (for Apple Events/keystrokes)
        const accessibilityGranted = systemPreferences.isTrustedAccessibilityClient(false)
        console.log('Accessibility permission status:', accessibilityGranted)

        if (!accessibilityGranted) {
          console.log('Accessibility permission needed. Opening System Preferences...')
          // This will prompt user to grant accessibility permission
          systemPreferences.isTrustedAccessibilityClient(true)
        }
      } catch (error) {
        console.error('Error requesting permissions:', error)
      }
    }
  }

  /**
   * Check microphone permission status
   */
  static getMicrophonePermissionStatus() {
    if (process.platform === 'darwin') {
      const { systemPreferences } = require('electron')
      return systemPreferences.getMediaAccessStatus('microphone')
    }
    return 'granted' // Assume granted on other platforms
  }

  /**
   * Check accessibility permission status
   */
  static getAccessibilityPermissionStatus() {
    if (process.platform === 'darwin') {
      const { systemPreferences } = require('electron')
      return systemPreferences.isTrustedAccessibilityClient(false)
    }
    return true // Assume granted on other platforms
  }
}

module.exports = PermissionManager