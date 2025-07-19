// AI Model Configuration
export const AI_CONFIG = {
  whisper: {
    model: 'base', // tiny, base, small, medium, large
    language: 'auto', // or specific language code
    chunk_length: 5, // seconds
  },
  processing: {
    sample_rate: 16000,
    buffer_size: 1024,
    realtime_enabled: true,
  },
}

// Dictation Use Cases
export const USE_CASES = {
  AUTO: 'auto',
  EMAIL: 'email',
  DOCUMENT: 'document',
  NOTE: 'note',
  CODE: 'code',
  MEETING: 'meeting',
  SOCIAL_MEDIA: 'social_media',
  CREATIVE_WRITING: 'creative_writing',
  TECHNICAL: 'technical',
  CASUAL: 'casual',
}

// Dictation States
export const DICTATION_STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
}

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
    textMuted: '#a3a3a3',
  },
  SPACING: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },
  RADIUS: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
}

// App Settings Keys
export const SETTINGS_KEYS = {
  THEME: 'theme',
  AUTO_START_RECORDING: 'auto_start_recording',
  NOTIFICATION_ENABLED: 'notification_enabled',
  WHISPER_MODEL: 'whisper_model',
  LLAMA_MODEL: 'llama_model',
  LANGUAGE: 'language',
  DEFAULT_USE_CASE: 'default_use_case',
  AUTO_USE_CASE_DETECTION: 'auto_use_case_detection',
  AUTO_COPY_ON_COMPLETION: 'auto_copy_on_completion',
  WINDOW_POSITION: 'window_position',
  WINDOW_SIZE: 'window_size',
}

// Default Settings
export const DEFAULT_SETTINGS = {
  [SETTINGS_KEYS.THEME]: 'light',
  [SETTINGS_KEYS.AUTO_START_RECORDING]: false,
  [SETTINGS_KEYS.NOTIFICATION_ENABLED]: true,
  [SETTINGS_KEYS.WHISPER_MODEL]: 'base',
  [SETTINGS_KEYS.LLAMA_MODEL]: 'tinyllama',
  [SETTINGS_KEYS.LANGUAGE]: 'auto',
  [SETTINGS_KEYS.DEFAULT_USE_CASE]: 'auto',
  [SETTINGS_KEYS.AUTO_USE_CASE_DETECTION]: true,
  [SETTINGS_KEYS.AUTO_COPY_ON_COMPLETION]: false,
  [SETTINGS_KEYS.WINDOW_POSITION]: { x: 100, y: 100 },
  [SETTINGS_KEYS.WINDOW_SIZE]: { width: 600, height: 400 },
}

// Audio Processing Constants
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  BUFFER_SIZE: 1024,
  CHUNK_DURATION: 5, // seconds
  SILENCE_THRESHOLD: 0.01,
  MIN_SPEECH_DURATION: 0.5, // seconds
}

// Global Shortcuts
export const GLOBAL_SHORTCUTS = {
  TOGGLE_DICTATION: 'CmdOrCtrl+Shift+D',
  STOP_DICTATION: 'CmdOrCtrl+Shift+S',
  COPY_TRANSCRIPTION: 'CmdOrCtrl+Shift+C',
  SHOW_HIDE_APP: 'CmdOrCtrl+Shift+H',
}

// Error Messages
export const ERROR_MESSAGES = {
  AUDIO_PERMISSION_DENIED: 'Microphone permission is required',
  AI_MODEL_LOAD_FAILED: 'Failed to load AI model',
  TRANSCRIPTION_FAILED: 'Transcription processing failed',
  INVALID_AUDIO_INPUT: 'Invalid audio input detected',
  POST_PROCESSING_FAILED: 'Post-processing failed',
}

// Success Messages
export const SUCCESS_MESSAGES = {
  TRANSCRIPTION_COPIED: 'Transcription copied to clipboard',
  SETTINGS_SAVED: 'Settings saved successfully',
  POST_PROCESSING_COMPLETED: 'Post-processing completed',
}
