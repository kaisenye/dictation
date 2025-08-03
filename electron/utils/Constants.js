/**
 * Constants extracted from main.js and services
 * All hardcoded values centralized for easy configuration
 */

// Window Configuration
const WINDOW_CONFIG = {
  // Pill mode (default state)
  PILL: {
    WIDTH: 60,
    HEIGHT: 20,
    MIN_WIDTH: 60,
    MIN_HEIGHT: 20,
  },

  // Expanded mode (during recording)
  EXPANDED: {
    WIDTH: 100,
    HEIGHT: 40,
    MAX_WIDTH: 260,
    MAX_HEIGHT: 60,
  },

  // Expanded mode (legacy larger size)
  LEGACY_EXPANDED: {
    WIDTH: 100,
    HEIGHT: 60,
  },

  // Positioning
  MARGIN: 40,

  // Animation
  ANIMATION: {
    EXPAND_DURATION: 300,
    EXPAND_STEPS: 20,
    SHRINK_DURATION: 200,
    SHRINK_STEPS: 12,
  },
}

// Global Shortcuts
const SHORTCUTS = {
  TOGGLE_DICTATION: 'CmdOrCtrl+Shift+D',
  COPY_TRANSCRIPTION: 'CmdOrCtrl+Shift+C',
  SHOW_HIDE_APP: 'CmdOrCtrl+Shift+H',
  TOGGLE_AGENT_MODE: 'CmdOrCtrl+Shift+S',
}

// Server Configuration
const SERVER_CONFIG = {
  LLAMA: {
    PORT: 8080,
    HOST: '127.0.0.1',
    TIMEOUT: 2000,
    MAX_RETRIES: 3,
    WAIT_ATTEMPTS: 60,
    MODEL_WARMUP_TIME: 10000,
  },
}

// AI Model Configuration
const AI_MODELS = {
  WHISPER: {
    PREFERRED_MODELS: ['ggml-base.en.bin', 'ggml-base.bin', 'ggml-small.en.bin', 'ggml-tiny.en.bin'],
  },
  LLAMA: {
    PREFERRED_MODELS: [
      'phi-2.Q4_K_M.gguf',
      'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
      'mistral-7b-instruct-v0.2.Q4_K_M.gguf',
      'llama-2-7b-chat.Q4_K_M.gguf',
    ],
    CONTEXT_SIZE: 2048,
    THREADS: 2,
    GPU_LAYERS: 0,
    REPEAT_PENALTY: 1.1,
    TEMPERATURE: 0.7,
    BATCH_SIZE: 8,
  },
}

// Binary Paths
const BINARY_PATHS = {
  WHISPER: [
    // Development paths
    '../../whisper.cpp/build/bin/whisper-cli',
    '../../whisper.cpp/build/bin/main',
    '../../whisper.cpp/main',
    // Production paths
    '../whisper.cpp/build/bin/whisper-cli',
    '../whisper.cpp/build/bin/main',
    // System paths
    '/usr/local/bin/whisper-cli',
    '/opt/homebrew/bin/whisper-cli',
    'whisper-cli', // PATH lookup
  ],
  LLAMA: [
    // Development paths
    '../../llama.cpp/build/bin/llama-server',
    '../../llama.cpp/build/bin/server',
    '../../llama.cpp/build/bin/main',
    '../../llama.cpp/server',
    '../../llama.cpp/main',
    // System paths
    '/usr/local/bin/llama-server',
    '/opt/homebrew/bin/llama-server',
  ],
}

// Model Directory Paths
const MODEL_PATHS = {
  WHISPER: [
    // Development paths
    '../../whisper.cpp/models',
    // Production paths
    '../whisper.cpp/models',
    // User data directory (will be resolved at runtime)
    'models',
    // System paths
    '/opt/homebrew/share/whisper.cpp/models',
    '/usr/local/share/whisper.cpp/models',
  ],
  LLAMA: [
    // Development paths
    '../../llama.cpp/models',
    // Production paths
    '../llama.cpp/models',
    // User data directory (will be resolved at runtime)
    'models',
    // System paths
    '/opt/homebrew/share/llama.cpp/models',
    '/usr/local/share/llama.cpp/models',
  ],
}

// Icon Paths
const ICON_PATHS = [
  '../public/icon.png', // Development
  '../../public/icon.png', // Alternative structure
  '../public/icon.svg', // SVG fallback
  '../public/favicon.svg', // Final fallback
]

// HTTP and Network Configuration
const HTTP_CONFIG = {
  DEFAULT_TIMEOUT: 10000,
  AI_REQUEST_TIMEOUT: 30000, // 30 second timeout for AI requests
  RETRY_DELAY: 1000,
  EXPONENTIAL_BACKOFF_BASE: 2000,
  SHUTDOWN_TIMEOUT: 5000,
}

// Whisper Streaming Configuration
const WHISPER_STREAMING = {
  STEP_MS: 3000, // 3 second steps
  CONTEXT_MS: 5000, // 5 second context
  AUDIO_CTX_SIZE: 512,
}

// Timeouts and Delays
const TIMEOUTS = {
  PASTE_DELAY: 200,
  RETRY_DELAY: 1000,
  EXPONENTIAL_BACKOFF_BASE: 2000,
  SHUTDOWN_TIMEOUT: 5000,
}

// Request Configuration
const REQUEST_CONFIG = {
  MAX_TOKENS: 500,
  TEMPERATURE: 0.1,
  TOP_P: 0.5,
  STREAM: false,
}

// App Configuration
const APP_CONFIG = {
  NAME: 'Romo',
  DEV_SERVER_URL: 'http://localhost:5173',
  DIST_PATH: '../dist/index.html',
}

// Content Security Policy
const CSP = {
  DEFAULT_SRC: "'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
  SCRIPT_SRC: "'self' 'unsafe-inline' 'unsafe-eval'",
  STYLE_SRC: "'self' 'unsafe-inline' https://fonts.googleapis.com",
  FONT_SRC: "'self' https://fonts.gstatic.com",
  IMG_SRC: "'self' data: blob:",
  CONNECT_SRC: "'self' ws: wss:",
}

// Export all constants
module.exports = {
  WINDOW_CONFIG,
  SHORTCUTS,
  SERVER_CONFIG,
  AI_MODELS,
  BINARY_PATHS,
  MODEL_PATHS,
  ICON_PATHS,
  HTTP_CONFIG,
  WHISPER_STREAMING,
  TIMEOUTS,
  REQUEST_CONFIG,
  APP_CONFIG,
  CSP,
}
