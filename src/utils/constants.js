// AI Model Configuration
export const AI_CONFIG = {
  whisper: {
    model: 'base', // tiny, base, small, medium, large
    language: 'auto', // or specific language code
    chunk_length: 5, // seconds
  },
  diarization: {
    min_speakers: 1,
    max_speakers: 10,
    clustering_threshold: 0.7,
  },
  processing: {
    sample_rate: 16000,
    buffer_size: 1024,
    realtime_enabled: true,
  }
};

// Meeting Platform Types
export const PLATFORMS = {
  ZOOM: 'zoom',
  TEAMS: 'teams',
  MEET: 'meet',
  MANUAL: 'manual'
};

// Meeting States
export const MEETING_STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// UI Constants
export const UI_CONSTANTS = {
  COLORS: {
    // Primary Grays
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#e5e5e5',
    gray300: '#d4d4d4',
    gray400: '#a3a3a3',
    gray500: '#737373',
    gray600: '#525252',
    gray700: '#404040',
    gray800: '#262626',
    gray900: '#171717',
    
    // Accent Colors
    blue500: '#3b82f6',
    green500: '#10b981',
    amber500: '#f59e0b',
    red500: '#ef4444',
    
    // Semantic Colors
    background: '#fafafa',
    surface: '#ffffff',
    border: '#e5e5e5',
    textPrimary: '#171717',
    textSecondary: '#525252',
    textMuted: '#a3a3a3'
  },
  SPACING: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px'
  },
  RADIUS: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  }
};

// App Settings Keys
export const SETTINGS_KEYS = {
  THEME: 'theme',
  AUTO_START_RECORDING: 'auto_start_recording',
  NOTIFICATION_ENABLED: 'notification_enabled',
  WHISPER_MODEL: 'whisper_model',
  LANGUAGE: 'language',
  DATA_RETENTION_DAYS: 'data_retention_days',
  EXPORT_FORMAT: 'export_format'
};

// Default Settings
export const DEFAULT_SETTINGS = {
  [SETTINGS_KEYS.THEME]: 'light',
  [SETTINGS_KEYS.AUTO_START_RECORDING]: false,
  [SETTINGS_KEYS.NOTIFICATION_ENABLED]: true,
  [SETTINGS_KEYS.WHISPER_MODEL]: 'base',
  [SETTINGS_KEYS.LANGUAGE]: 'auto',
  [SETTINGS_KEYS.DATA_RETENTION_DAYS]: 90,
  [SETTINGS_KEYS.EXPORT_FORMAT]: 'pdf'
};

// Audio Processing Constants
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  BUFFER_SIZE: 1024,
  CHUNK_DURATION: 5, // seconds
  SILENCE_THRESHOLD: 0.01,
  MIN_SPEECH_DURATION: 0.5 // seconds
};

// File Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  TXT: 'txt',
  JSON: 'json',
  CSV: 'csv'
};

// Keyboard Shortcuts
export const SHORTCUTS = {
  NEW_MEETING: 'cmd+n',
  STOP_RECORDING: 'cmd+shift+r',
  SEARCH: 'cmd+f',
  SETTINGS: 'cmd+comma',
  QUIT: 'cmd+q'
};

// Error Messages
export const ERROR_MESSAGES = {
  DATABASE_ERROR: 'Database operation failed',
  AUDIO_PERMISSION_DENIED: 'Microphone permission is required',
  SCREEN_PERMISSION_DENIED: 'Screen recording permission is required',
  AI_MODEL_LOAD_FAILED: 'Failed to load AI model',
  TRANSCRIPTION_FAILED: 'Transcription processing failed',
  MEETING_NOT_FOUND: 'Meeting not found',
  INVALID_AUDIO_INPUT: 'Invalid audio input detected'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  MEETING_CREATED: 'Meeting created successfully',
  MEETING_SAVED: 'Meeting saved successfully',
  MEETING_DELETED: 'Meeting deleted successfully',
  EXPORT_COMPLETED: 'Export completed successfully',
  SETTINGS_SAVED: 'Settings saved successfully'
}; 