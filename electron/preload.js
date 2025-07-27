const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,

  // AI Service operations
  aiInitialize: () => ipcRenderer.invoke('ai-initialize'),
  aiProcessChunk: (audioBuffer, sampleRate) => ipcRenderer.invoke('ai-process-chunk', audioBuffer, sampleRate),
  aiProcessFile: (audioFilePath) => ipcRenderer.invoke('ai-process-file', audioFilePath),
  aiProcessFullRecording: (audioBuffer, sampleRate, meetingId) =>
    ipcRenderer.invoke('ai-process-full-recording', audioBuffer, sampleRate, meetingId),
  saveLiveTranscriptionSegments: (segments, meetingId) =>
    ipcRenderer.invoke('save-live-transcription-segments', segments, meetingId),
  aiGetStatus: () => ipcRenderer.invoke('ai-get-status'),
  aiShutdown: () => ipcRenderer.invoke('ai-shutdown'),

  // Llama.cpp Service operations
  llamaInitialize: () => ipcRenderer.invoke('llama-initialize'),
  llamaAnswerQuestion: (question, meetingId, transcripts, speakers) =>
    ipcRenderer.invoke('llama-answer-question', question, meetingId, transcripts, speakers),
  llamaGenerateSummary: (meetingId, transcripts, speakers) =>
    ipcRenderer.invoke('llama-generate-summary', meetingId, transcripts, speakers),
  llamaGetStatus: () => ipcRenderer.invoke('llama-get-status'),
  llamaClearHistory: (meetingId) => ipcRenderer.invoke('llama-clear-history', meetingId),

  // Audio processing methods for React components (aliases for convenience)
  processAudioChunk: (audioBuffer, sampleRate = 16000) =>
    ipcRenderer.invoke('ai-process-chunk', audioBuffer, sampleRate),

  // Window operations
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  saveWindowPosition: (position) => ipcRenderer.invoke('save-window-position', position),
  loadWindowPosition: () => ipcRenderer.invoke('load-window-position'),

  // Window expansion operations
  expandWindowForRecording: () => ipcRenderer.invoke('expand-window-for-recording'),
  shrinkWindowToPill: () => ipcRenderer.invoke('shrink-window-to-pill'),

  // Global shortcut events
  onGlobalShortcutStartRecording: (callback) => ipcRenderer.on('global-shortcut-start-recording', callback),
  onGlobalShortcutStopRecording: (callback) => ipcRenderer.on('global-shortcut-stop-recording', callback),
  onGlobalShortcutToggleDictation: (callback) => ipcRenderer.on('global-shortcut-toggle-dictation', callback),
  onGlobalShortcutCopyTranscription: (callback) => ipcRenderer.on('global-shortcut-copy-transcription', callback),
  onTrayStartDictation: (callback) => ipcRenderer.on('tray-start-dictation', callback),
  onTrayOpenSettings: (callback) => ipcRenderer.on('tray-open-settings', callback),
  onWindowPositionChanged: (callback) => ipcRenderer.on('window-position-changed', callback),

  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Clipboard and paste operations
  pasteToFocusedApp: (text) => ipcRenderer.invoke('paste-to-focused-app', text),
})
