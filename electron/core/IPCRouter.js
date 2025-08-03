const { ipcMain, Notification } = require('electron')
const fs = require('fs').promises
const { TIMEOUTS } = require('../utils/Constants.js')
const ErrorUtils = require('../utils/ErrorUtils.js')

/**
 * IPCRouter - Extracted from main.js
 * Handles all IPC communication between main and renderer processes
 * PRESERVES EXACT FUNCTIONALITY from original main.js setupIpcHandlers()
 */
class IPCRouter {
  constructor(windowManager, whisperService, llamaService) {
    this.windowManager = windowManager
    this.whisperService = whisperService
    this.llamaService = llamaService
  }

  /**
   * Register all IPC handlers
   * EXACT COPY from main.js lines 156-451
   */
  registerHandlers() {
    // Path utilities
    ipcMain.handle('get-user-data-path', () => {
      const { app } = require('electron')
      return app.getPath('userData')
    })

    ipcMain.handle('get-app-path', () => {
      const { app } = require('electron')
      return app.getAppPath()
    })

    // File system operations
    ipcMain.handle('read-file', ErrorUtils.wrapIPCHandler(async (event, filePath) => {
      const data = await fs.readFile(filePath, 'utf8')
      return { data }
    }, 'read file'))

    ipcMain.handle('write-file', ErrorUtils.wrapIPCHandler(async (event, filePath, data) => {
      await fs.writeFile(filePath, data, 'utf8')
      return { written: true }
    }, 'write file'))

    // Window operations
    ipcMain.handle('minimize-window', () => {
      this.windowManager.minimizeWindow()
    })

    ipcMain.handle('maximize-window', () => {
      this.windowManager.maximizeWindow()
    })

    ipcMain.handle('close-window', () => {
      this.windowManager.closeWindow()
    })

    // Notifications
    ipcMain.handle('show-notification', (event, title, body) => {
      if (Notification.isSupported()) {
        new Notification({
          title: title,
          body: body,
        }).show()
      }
    })

    // Window expansion for recording with spring animation
    ipcMain.handle('expand-window-for-recording', async () => {
      return await this.windowManager.expandWindowForRecording()
    })

    ipcMain.handle('shrink-window-to-pill', async () => {
      return await this.windowManager.shrinkWindowToPill()
    })

    // Clipboard and paste operations
    ipcMain.handle('paste-to-focused-app', async (event, text) => {
      try {
        const { clipboard } = require('electron')

        // Set text to clipboard
        clipboard.writeText(text)

        // DON'T hide the window - keep pill visible
        // Just ensure the previously focused app regains focus without hiding our pill

        // Small delay to ensure the target app regains focus
        setTimeout(() => {
          // Simulate Cmd+V keypress on macOS
          if (process.platform === 'darwin') {
            const { execSync } = require('child_process')
            try {
              // Use AppleScript to simulate Cmd+V
              execSync(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`)
            } catch (scriptError) {
              console.warn('Failed to simulate paste keystroke:', scriptError.message)
            }
          }
        }, TIMEOUTS.PASTE_DELAY) // Was: 200

        return { success: true }
      } catch (error) {
        console.error('Failed to paste to focused app:', error)
        return { success: false, error: error.message }
      }
    })

    // AI Service handlers
    ipcMain.handle('ai-initialize', async () => {
      try {
        await this.whisperService.initialize()
        return { success: true }
      } catch (error) {
        console.error('Failed to initialize AI service:', error)
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('ai-process-chunk', async (event, audioBuffer, sampleRate) => {
      try {
        const result = await this.whisperService.processAudioChunk(audioBuffer, sampleRate)
        return { success: true, result }
      } catch (error) {
        console.error('Failed to process audio chunk:', error)
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('ai-process-full-recording', async (event, audioBuffer, sampleRate, meetingId) => {
      try {
        console.log(`Processing full recording for meeting ${meetingId}`)
        console.log('Audio buffer type:', typeof audioBuffer)
        console.log('Sample rate:', sampleRate)

        if (!audioBuffer || audioBuffer.length === 0) {
          console.error('Audio buffer is empty or invalid')
          return { success: false, error: 'Audio buffer is empty or invalid' }
        }

        // Process the audio using the same method as real-time chunks
        const result = await this.whisperService.processAudioChunk(audioBuffer, sampleRate)
        console.log('Whisper.cpp result:', result)

        return { success: true, result }
      } catch (error) {
        console.error('Failed to process full recording:', error)
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('ai-process-file', async (event, audioFilePath) => {
      try {
        const result = await this.whisperService.processAudioFile(audioFilePath)
        return { success: true, result }
      } catch (error) {
        console.error('Failed to process audio file:', error)
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('ai-get-status', async () => {
      try {
        return {
          success: true,
          initialized: this.whisperService.isInitialized,
          modelPath: this.whisperService.modelPath,
        }
      } catch (error) {
        console.error('Failed to get AI service status:', error)
        return { success: false, error: error.message }
      }
    })

    ipcMain.handle('ai-shutdown', async () => {
      try {
        await this.whisperService.shutdown()
        return { success: true }
      } catch (error) {
        console.error('Failed to shutdown AI service:', error)
        return { success: false, error: error.message }
      }
    })

    // LLM Service - Now enabled with improved /v1/chat/completions endpoint
    ipcMain.handle('llama-refine-transcript', async (event, transcript) => {
      console.log('\n🔄 LLAMA REFINEMENT REQUEST')
      console.log('Original transcript:', `"${transcript}"`)
      try {
        const refinedTranscript = await this.llamaService.refineTranscript(transcript)
        console.log('✅ LLAMA REFINEMENT SUCCESS')
        console.log('Refined transcript:', `"${refinedTranscript}"`)
        console.log('================================\n')
        return { success: true, refinedTranscript }
      } catch (error) {
        console.error('❌ LLAMA REFINEMENT FAILED:', error.message)
        console.log('================================\n')
        return { success: false, error: error.message }
      }
    })

    // Agent Mode handlers (using LlamaCpp service)
    ipcMain.handle('agent-process-request', async (event, transcript) => {
      console.log('\n🤖 AGENT MODE REQUEST')
      console.log('Original transcript:', `"${transcript}"`)
      try {
        const result = await this.llamaService.processAgentRequest(transcript)
        console.log('✅ AGENT MODE SUCCESS')
        console.log('Result:', result)
        console.log('================================\n')
        return result
      } catch (error) {
        console.error('❌ AGENT MODE FAILED:', error.message)
        console.log('================================\n')
        return { success: false, error: error.message, fallbackContent: transcript }
      }
    })

    console.log('IPC handlers registered successfully')
  }

  /**
   * Unregister all handlers (useful for cleanup)
   */
  unregisterHandlers() {
    const handlers = [
      'get-user-data-path',
      'get-app-path',
      'read-file',
      'write-file',
      'minimize-window',
      'maximize-window', 
      'close-window',
      'show-notification',
      'expand-window-for-recording',
      'shrink-window-to-pill',
      'paste-to-focused-app',
      'ai-initialize',
      'ai-process-chunk',
      'ai-process-full-recording',
      'ai-process-file',
      'ai-get-status',
      'ai-shutdown',
      'llama-refine-transcript',
      'agent-process-request',
    ]

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler)
    })

    console.log('IPC handlers unregistered')
  }
}

module.exports = IPCRouter