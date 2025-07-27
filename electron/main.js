const { app, BrowserWindow, Menu, shell, ipcMain, Notification, globalShortcut, Tray } = require('electron')
const path = require('path')
const fs = require('fs').promises
const whisperCppService = require('./services/whisperCppService')
const llamaCppService = require('./services/llamaCppService')
const isDev = process.env.IS_DEV === 'true'

let mainWindow
let tray = null

// Get bottom center position for window - always return pill size position
function getBottomCenterPosition() {
  const { screen } = require('electron')
  const cursorPosition = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPosition)

  const windowWidth = 60 // Tiny pill width
  const windowHeight = 20 // Tiny pill height
  const margin = 40

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

// Helper function to show window on current desktop
async function showWindowOnCurrentDesktop() {
  if (mainWindow) {
    // If window is already visible, just focus it
    if (mainWindow.isVisible()) {
      mainWindow.focus()
      return
    }

    // First ensure the window is visible on all workspaces
    if (process.platform === 'darwin') {
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    }

    // Always position at bottom center (ignore saved position)
    const position = getBottomCenterPosition()
    mainWindow.setPosition(position.x, position.y)
    console.log('Window positioned at bottom center:', position)

    // Ensure window stays on top
    mainWindow.setAlwaysOnTop(true)

    // Show and focus the window
    mainWindow.show()
    mainWindow.focus()
  }
}

function createWindow() {
  // Create the browser window - tiny pill that expands during recording
  mainWindow = new BrowserWindow({
    width: 60, // Start as tiny pill
    height: 20,
    minWidth: 60,
    minHeight: 20,
    maxWidth: 260, // Smaller expanded size
    maxHeight: 60,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../build/icon.png'),
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
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: blob:; " +
            "connect-src 'self' ws: wss:;",
        ],
      },
    })
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // Removed auto-opening of dev tools
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    // Show immediately in pill mode at bottom center
    const position = getBottomCenterPosition()
    mainWindow.setPosition(position.x, position.y)
    mainWindow.show()

    // Ensure window appears on current desktop when shown
    if (process.platform === 'darwin') {
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    }
  })

  // Handle window closed
  mainWindow.on('closed', async () => {
    mainWindow = null
    // Shutdown AI services
    try {
      await whisperCppService.shutdown()
      await llamaCppService.shutdown()
    } catch (error) {
      console.error('Error shutting down AI services:', error)
    }
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Remove position tracking - window will always appear at bottom center
}

// Database migration function
async function runMigrations() {
  return new Promise((resolve, reject) => {
    // Check existing columns in meetings table
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('runMigrations called, but database is no longer initialized.')
    resolve()
  })
}

// Database initialization
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // This function is no longer needed as database dependencies are removed.
      // Keeping it for now in case it's called elsewhere or for future use.
      console.log('initializeDatabase called, but database is no longer initialized.')
      resolve(true)
    } catch (error) {
      console.error('Failed to initialize database:', error)
      reject(error)
    }
  })
}

// Helper function to promisify database operations
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('dbRun called, but database is no longer initialized.')
    resolve({ lastID: null, changes: 0 }) // Return dummy values
  })
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('dbGet called, but database is no longer initialized.')
    resolve(null) // Return dummy value
  })
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('dbAll called, but database is no longer initialized.')
    resolve([]) // Return dummy value
  })
}

// IPC Handlers
function setupIpcHandlers() {
  // Path utilities
  ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData')
  })

  ipcMain.handle('get-app-path', () => {
    return app.getAppPath()
  })

  // Database initialization
  ipcMain.handle('initializeDatabase', async () => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('initializeDatabase IPC handler called, but database is no longer initialized.')
    return true // Always return true as database is removed
  })

  // Meeting operations
  ipcMain.handle('createMeeting', async (event, meetingData) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('createMeeting IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  ipcMain.handle('getMeeting', async (event, id) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('getMeeting IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  ipcMain.handle('getAllMeetings', async (event, limit = 50, offset = 0) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('getAllMeetings IPC handler called, but database is no longer initialized.')
    return [] // Return dummy value
  })

  ipcMain.handle('updateMeeting', async (event, id, updates) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('updateMeeting IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  ipcMain.handle('deleteMeeting', async (event, id) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('deleteMeeting IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  ipcMain.handle('endMeeting', async (event, id, endTime, duration) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('endMeeting IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  // Transcript operations
  ipcMain.handle('addTranscript', async (event, transcriptData) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('addTranscript IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  ipcMain.handle('getTranscripts', async (event, meetingId) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('getTranscripts IPC handler called, but database is no longer initialized.')
    return [] // Return dummy value
  })

  ipcMain.handle('searchTranscripts', async (event, query, meetingId = null) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('searchTranscripts IPC handler called, but database is no longer initialized.')
    return [] // Return dummy value
  })

  // Speaker operations
  ipcMain.handle('addOrUpdateSpeaker', async (event, speakerData) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('addOrUpdateSpeaker IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  ipcMain.handle('getSpeakers', async (event, meetingId) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('getSpeakers IPC handler called, but database is no longer initialized.')
    return [] // Return dummy value
  })

  ipcMain.handle('updateSpeakerName', async (event, speakerId, meetingId, displayName) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('updateSpeakerName IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  // Settings operations
  ipcMain.handle('getSetting', async (event, key) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('getSetting IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  ipcMain.handle('setSetting', async (event, key, value) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('setSetting IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  // Analytics and statistics
  ipcMain.handle('getMeetingStats', async (event) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('getMeetingStats IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  // Database maintenance
  ipcMain.handle('vacuum', async (event) => {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('vacuum IPC handler called, but database is no longer initialized.')
    return null // Return dummy value
  })

  // Utility function to save transcript segments and speakers
  async function saveTranscriptSegments(segments, meetingId) {
    // This function is no longer needed as database dependencies are removed.
    // Keeping it for now in case it's called elsewhere or for future use.
    console.log('saveTranscriptSegments called, but database is no longer initialized.')
    return { success: true }
  }

  // File system operations
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf8')
      return data
    } catch (error) {
      console.error('Failed to read file:', error)
      throw error
    }
  })

  ipcMain.handle('write-file', async (event, filePath, data) => {
    try {
      await fs.writeFile(filePath, data, 'utf8')
      return true
    } catch (error) {
      console.error('Failed to write file:', error)
      throw error
    }
  })

  // Window operations
  ipcMain.handle('minimize-window', () => {
    if (mainWindow) mainWindow.minimize()
  })

  ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.handle('close-window', () => {
    if (mainWindow) mainWindow.close()
  })

  // Removed window position save/load - window always appears at bottom center

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
    try {
      if (mainWindow) {
        const position = getBottomCenterPosition()
        const targetWidth = 100 // Smaller width
        const targetHeight = 40 // Smaller height
        const startWidth = 50
        const startHeight = 20

        // Spring animation parameters
        const duration = 300 // ms
        const steps = 20
        const stepDuration = duration / steps

        // Animate with spring easing
        for (let i = 0; i <= steps; i++) {
          const progress = i / steps
          // Spring easing function (easeOutBack)
          const springProgress = 1 + 2.7 * Math.pow(progress - 1, 3) + 1.7 * Math.pow(progress - 1, 2)
          const clampedProgress = Math.max(0, Math.min(1, springProgress))

          const currentWidth = startWidth + (targetWidth - startWidth) * clampedProgress
          const currentHeight = startHeight + (targetHeight - startHeight) * clampedProgress
          const currentX = position.x - (currentWidth - startWidth) / 2
          const currentY = position.y - (currentHeight - startHeight) / 2

          setTimeout(() => {
            if (mainWindow) {
              mainWindow.setSize(Math.round(currentWidth), Math.round(currentHeight))
              mainWindow.setPosition(Math.round(currentX), Math.round(currentY))
            }
          }, i * stepDuration)
        }

        console.log('Window expanding with spring animation')
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to expand window:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('shrink-window-to-pill', async () => {
    try {
      if (mainWindow) {
        const position = getBottomCenterPosition()
        const targetWidth = 60
        const targetHeight = 20
        const startWidth = 100 // Match the new expanded size
        const startHeight = 60

        // Get current position (should be expanded)
        const bounds = mainWindow.getBounds()
        const startX = bounds.x
        const startY = bounds.y

        // Spring animation parameters
        const duration = 200 // ms (faster for responsive feel)
        const steps = 12
        const stepDuration = duration / steps

        // Animate with spring easing
        for (let i = 0; i <= steps; i++) {
          const progress = i / steps
          // Smoother spring easing function (easeOutQuart)
          const springProgress = 1 - Math.pow(1 - progress, 4)
          const clampedProgress = Math.max(0, Math.min(1, springProgress))

          const currentWidth = startWidth + (targetWidth - startWidth) * clampedProgress
          const currentHeight = startHeight + (targetHeight - startHeight) * clampedProgress
          const currentX = startX + (position.x - startX) * clampedProgress
          const currentY = startY + (position.y - startY) * clampedProgress

          setTimeout(() => {
            if (mainWindow) {
              mainWindow.setSize(Math.round(currentWidth), Math.round(currentHeight))
              mainWindow.setPosition(Math.round(currentX), Math.round(currentY))
            }
          }, i * stepDuration)
        }

        console.log('Window shrinking with spring animation')
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to shrink window:', error)
      return { success: false, error: error.message }
    }
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
      }, 200)

      return { success: true }
    } catch (error) {
      console.error('Failed to paste to focused app:', error)
      return { success: false, error: error.message }
    }
  })

  // AI Service handlers
  ipcMain.handle('ai-initialize', async () => {
    try {
      await whisperCppService.initialize()
      return { success: true }
    } catch (error) {
      console.error('Failed to initialize AI service:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ai-process-chunk', async (event, audioBuffer, sampleRate) => {
    try {
      const result = await whisperCppService.processAudioChunk(audioBuffer, sampleRate)
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
      const result = await whisperCppService.processAudioChunk(audioBuffer, sampleRate)
      console.log('Whisper.cpp result:', result)

      // Store transcription results in database
      console.log('Checking result structure:', {
        hasResult: !!result,
        hasSegments: !!(result && result.segments),
        segmentsLength: result?.segments?.length || 0,
      })

      if (result && result.segments && result.segments.length > 0) {
        console.log(`Storing ${result.segments.length} transcript segments`)
        await saveTranscriptSegments(result.segments, meetingId)
        console.log('Updated meeting transcription status')
      } else {
        console.log('No segments found in result, not storing anything')
      }

      return { success: true, result }
    } catch (error) {
      console.error('Failed to process full recording:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('save-live-transcription-segments', async (event, segments, meetingId) => {
    try {
      console.log(`Saving ${segments.length} live transcription segments for meeting ${meetingId}`)
      return await saveTranscriptSegments(segments, meetingId)
    } catch (error) {
      console.error('Failed to save live transcription segments:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ai-process-file', async (event, audioFilePath) => {
    try {
      const result = await whisperCppService.processAudioFile(audioFilePath)
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
        initialized: whisperCppService.isInitialized,
        modelPath: whisperCppService.modelPath,
      }
    } catch (error) {
      console.error('Failed to get AI service status:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ai-shutdown', async () => {
    try {
      await whisperCppService.shutdown()
      return { success: true }
    } catch (error) {
      console.error('Failed to shutdown AI service:', error)
      return { success: false, error: error.message }
    }
  })

  // Llama.cpp Service handlers
  ipcMain.handle('llama-initialize', async () => {
    try {
      await llamaCppService.initialize()
      return { success: true }
    } catch (error) {
      console.error('Failed to initialize Llama.cpp service:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('llama-answer-question', async (event, question, meetingId, transcripts, speakers) => {
    try {
      const answer = await llamaCppService.answerMeetingQuestion(question, meetingId, transcripts, speakers)
      return { success: true, answer }
    } catch (error) {
      console.error('Failed to answer question:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('llama-generate-summary', async (event, meetingId, transcripts, speakers) => {
    try {
      const summary = await llamaCppService.generateMeetingSummary(meetingId, transcripts, speakers)
      return { success: true, summary }
    } catch (error) {
      console.error('Failed to generate summary:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('llama-get-status', async () => {
    try {
      return {
        success: true,
        initialized: llamaCppService.isInitialized,
        modelPath: llamaCppService.modelPath,
      }
    } catch (error) {
      console.error('Failed to get Llama.cpp service status:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('llama-clear-history', async (event, meetingId) => {
    try {
      llamaCppService.clearConversationHistory(meetingId)
      return { success: true }
    } catch (error) {
      console.error('Failed to clear conversation history:', error)
      return { success: false, error: error.message }
    }
  })
}

// Create application menu for macOS
function createMenu() {
  const template = [
    {
      label: 'Romo',
      submenu: [
        {
          label: 'About Romo',
          role: 'about',
        },
        { type: 'separator' },
        {
          label: 'Hide Romo',
          accelerator: 'Command+H',
          role: 'hide',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers',
        },
        {
          label: 'Show All',
          role: 'unhide',
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Meeting',
          accelerator: 'Command+N',
          click: () => {
            mainWindow.webContents.send('menu-new-meeting')
          },
        },
        { type: 'separator' },
        {
          label: 'Export Meeting',
          accelerator: 'Command+E',
          click: () => {
            mainWindow.webContents.send('menu-export-meeting')
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Simple recording state
let isRecording = false

// Global shortcut and tray management
function registerGlobalShortcuts() {
  // Unregister any existing shortcuts first
  globalShortcut.unregisterAll()

  // SIMPLE SOLUTION: Pure toggle
  // Press once = start recording
  // Press again = stop recording
  const toggleSuccess = globalShortcut.register('CmdOrCtrl+Shift+D', async () => {
    console.log('=== Cmd+Shift+D pressed ===')

    if (!mainWindow) return

    if (!isRecording) {
      // Start recording
      console.log('Starting recording')
      isRecording = true
      mainWindow.webContents.send('global-shortcut-start-recording')
    } else {
      // Stop recording
      console.log('Stopping recording')
      isRecording = false
      mainWindow.webContents.send('global-shortcut-stop-recording')
    }
  })

  if (!toggleSuccess) {
    console.log('Failed to register Cmd+Shift+D shortcut')
  } else {
    console.log('Successfully registered Cmd+Shift+D - press to start, press again to stop')
  }

  // Copy transcription
  const copySuccess = globalShortcut.register('CmdOrCtrl+Shift+C', () => {
    console.log('Global shortcut CmdOrCtrl+Shift+C pressed')
    if (mainWindow) {
      mainWindow.webContents.send('global-shortcut-copy-transcription')
    }
  })

  if (!copySuccess) {
    console.log('Failed to register CmdOrCtrl+Shift+C shortcut')
  }

  // Show/hide app
  const showHideSuccess = globalShortcut.register('CmdOrCtrl+Shift+H', async () => {
    console.log('Global shortcut CmdOrCtrl+Shift+H pressed')
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        await showWindowOnCurrentDesktop()
      }
    }
  })

  if (!showHideSuccess) {
    console.log('Failed to register CmdOrCtrl+Shift+H shortcut')
  }

  console.log('Global shortcuts registered successfully')
}

function createTray() {
  // Create tray icon with fallback
  let iconPath
  try {
    // Try to use the PNG icon first
    iconPath = path.join(__dirname, '../build/icon.png')
    if (!require('fs').existsSync(iconPath)) {
      // Fallback to SVG icon
      iconPath = path.join(__dirname, '../build/icon.svg')
      if (!require('fs').existsSync(iconPath)) {
        // Use a default icon or create a simple one
        iconPath = path.join(__dirname, '../public/favicon.svg')
      }
    }
    console.log('Using tray icon:', iconPath)
  } catch (error) {
    console.warn('Icon path resolution failed, using default:', error.message)
    iconPath = path.join(__dirname, '../public/favicon.svg')
  }

  try {
    tray = new Tray(iconPath)
    console.log('Tray created successfully with icon')
  } catch (error) {
    console.error('Failed to create tray with icon:', error.message)
    // Create tray without icon (will use default system icon)
    try {
      tray = new Tray('')
      console.log('Tray created successfully without icon')
    } catch (fallbackError) {
      console.error('Failed to create tray even without icon:', fallbackError.message)
      return // Don't create tray if it fails completely
    }
  }

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Start Dictation',
      click: async () => {
        if (mainWindow) {
          await showWindowOnCurrentDesktop()
          mainWindow.webContents.send('tray-start-dictation')
        }
      },
    },
    {
      label: 'Settings',
      click: async () => {
        if (mainWindow) {
          await showWindowOnCurrentDesktop()
          mainWindow.webContents.send('tray-open-settings')
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('Romo')

  // Handle tray icon click
  tray.on('click', async () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        await showWindowOnCurrentDesktop()
      }
    }
  })

  console.log('Tray created successfully')
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Initialize AI services
    console.log('Initializing AI services...')

    // Initialize Whisper.cpp (required for transcription)
    try {
      await whisperCppService.initialize()
      console.log('Whisper.cpp service initialized successfully')
    } catch (whisperError) {
      console.warn('Whisper.cpp service initialization failed, will retry on demand:', whisperError.message)
      // Don't fail the app startup for Whisper.cpp - it can be retried later
    }

    // Initialize Llama.cpp (optional for post-processing)
    try {
      await llamaCppService.initialize()
      console.log('Llama.cpp service initialized successfully')
    } catch (llamaError) {
      console.warn('Llama.cpp service initialization failed, will retry on demand:', llamaError.message)
      // Don't fail the app startup for Llama.cpp - it's optional for post-processing
    }

    // Create window and set up handlers (these are required)
    createWindow()
    createMenu()
    setupIpcHandlers()
    registerGlobalShortcuts()

    // Window will always appear at bottom center when shown

    // Create tray (handle errors gracefully)
    try {
      createTray()
    } catch (trayError) {
      console.warn('Failed to create tray, continuing without tray:', trayError.message)
    }

    app.on('activate', async () => {
      // On macOS, re-create window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      } else if (mainWindow) {
        // If window exists but is hidden, show it on current desktop
        if (!mainWindow.isVisible()) {
          await showWindowOnCurrentDesktop()
        } else {
          mainWindow.focus()
        }
      }
    })

    console.log('App initialization completed successfully')
  } catch (error) {
    console.error('Failed to initialize app:', error)
    // Show error dialog and quit
    const { dialog } = require('electron')
    dialog.showErrorBox('Initialization Error', 'Failed to initialize the application. Please try again.')
    app.quit()
  }
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, url) => {
    navigationEvent.preventDefault()
  })
})
