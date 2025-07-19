const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  
  // Database initialization
  initializeDatabase: () => ipcRenderer.invoke('initializeDatabase'),
  
  // Database utilities
  getDbPath: () => ipcRenderer.invoke('get-user-data-path').then(userDataPath => 
    userDataPath + '/meeting-helper.db'
  ),
  
  getSchemaPath: () => ipcRenderer.invoke('get-app-path').then(appPath => 
    appPath + '/electron/database/schema.sql'
  ),

  // Meeting operations
  createMeeting: (meetingData) => ipcRenderer.invoke('createMeeting', meetingData),
  getMeeting: (id) => ipcRenderer.invoke('getMeeting', id),
  getAllMeetings: (limit, offset) => ipcRenderer.invoke('getAllMeetings', limit, offset),
  updateMeeting: (id, updates) => ipcRenderer.invoke('updateMeeting', id, updates),
  deleteMeeting: (id) => ipcRenderer.invoke('deleteMeeting', id),
  endMeeting: (id, endTime, duration) => ipcRenderer.invoke('endMeeting', id, endTime, duration),

  // Transcript operations
  addTranscript: (transcriptData) => ipcRenderer.invoke('addTranscript', transcriptData),
  getTranscripts: (meetingId) => ipcRenderer.invoke('getTranscripts', meetingId),
  searchTranscripts: (query, meetingId) => ipcRenderer.invoke('searchTranscripts', query, meetingId),

  // Speaker operations
  addOrUpdateSpeaker: (speakerData) => ipcRenderer.invoke('addOrUpdateSpeaker', speakerData),
  getSpeakers: (meetingId) => ipcRenderer.invoke('getSpeakers', meetingId),
  updateSpeakerName: (speakerId, meetingId, displayName) => ipcRenderer.invoke('updateSpeakerName', speakerId, meetingId, displayName),

  // Settings operations
  getSetting: (key) => ipcRenderer.invoke('getSetting', key),
  setSetting: (key, value) => ipcRenderer.invoke('setSetting', key, value),

  // Analytics and statistics
  getMeetingStats: () => ipcRenderer.invoke('getMeetingStats'),

  // Database maintenance
  vacuum: () => ipcRenderer.invoke('vacuum'),
  
  // File system operations
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, data) => ipcRenderer.invoke('write-file', path, data),
  
  // AI Service operations
  aiInitialize: () => ipcRenderer.invoke('ai-initialize'),
  aiProcessChunk: (audioBuffer, sampleRate) => ipcRenderer.invoke('ai-process-chunk', audioBuffer, sampleRate),
  aiProcessFile: (audioFilePath) => ipcRenderer.invoke('ai-process-file', audioFilePath),
  aiProcessFullRecording: (audioBuffer, sampleRate, meetingId) => ipcRenderer.invoke('ai-process-full-recording', audioBuffer, sampleRate, meetingId),
  saveLiveTranscriptionSegments: (segments, meetingId) => ipcRenderer.invoke('save-live-transcription-segments', segments, meetingId),
  aiGetStatus: () => ipcRenderer.invoke('ai-get-status'),
  aiShutdown: () => ipcRenderer.invoke('ai-shutdown'),
  
  // Llama.cpp Service operations
  llamaInitialize: () => ipcRenderer.invoke('llama-initialize'),
  llamaAnswerQuestion: (question, meetingId, transcripts, speakers) => ipcRenderer.invoke('llama-answer-question', question, meetingId, transcripts, speakers),
  llamaGenerateSummary: (meetingId, transcripts, speakers) => ipcRenderer.invoke('llama-generate-summary', meetingId, transcripts, speakers),
  llamaGetStatus: () => ipcRenderer.invoke('llama-get-status'),
  llamaClearHistory: (meetingId) => ipcRenderer.invoke('llama-clear-history', meetingId),
  
  // Audio processing methods for React components (aliases for convenience)
  processAudioChunk: (audioBuffer, sampleRate = 16000) => 
    ipcRenderer.invoke('ai-process-chunk', audioBuffer, sampleRate),
  
  // Window operations
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body)
}); 