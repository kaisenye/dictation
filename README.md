# Romo

A modern Electron app for Mac built with React, Vite, and Tailwind CSS featuring intelligent dictation with real-time AI transcription powered by Whisper.cpp and advanced post-processing powered by Llama.cpp.

## 🚀 Features

- 🎤 **Real-time Dictation** - AI-powered speech-to-text using Whisper.cpp
- 🤖 **Intelligent Post-processing** - Llama.cpp powered content organization and formatting
- ⌨️ **Global Shortcuts** - Quick access with customizable keyboard shortcuts
- 🍎 **macOS Native** - Menu bar integration with tray icon
- 📝 **Use Case Detection** - Auto-detect and format content for different purposes
- 🔒 **Privacy-First** - All AI processing happens locally on your device
- 📋 **One-click Copy** - Instantly copy transcriptions to clipboard

## 🛠 Technology Stack

- **Electron** - Cross-platform desktop app framework
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Node.js** - JavaScript runtime
- **Whisper.cpp** - High-performance local speech recognition
- **Llama.cpp** - High-performance local language model inference

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **macOS** (app is optimized for Mac)
- **Git** (for cloning and building Whisper.cpp)
- **Xcode Command Line Tools** (for building Whisper.cpp)
  ```bash
  xcode-select --install
  ```

### Verify Installation
```bash
node --version    # Should be 16.0.0 or higher
npm --version     # Should be 8.0.0 or higher
git --version     # Required for Whisper.cpp setup
```

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd romo
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- Electron
- Vite and plugins
- Tailwind CSS and PostCSS
- Development tools

### 3. Setup AI Services
```bash
# Setup Whisper.cpp for transcription
npm run setup:whisper

# Setup Llama.cpp for post-processing
npm run setup:llama
```

This will:
- Download and build Whisper.cpp from source
- Download and build Llama.cpp from source
- Download optimized AI models for both services
- Test the installations
- Verify everything works correctly

**Note**: These steps are required for the AI features to work. The setup takes a few minutes but only needs to be run once.

### 4. Verify Installation
```bash
npm run dev
```
If this starts without errors, your setup is correct.

## 🚀 Development

### Start Development Server
Run the app in development mode with hot reload:

```bash
npm run electron:dev
```

This command will:
- Start Vite dev server on `http://localhost:5173`
- Launch Electron app with DevTools open
- Enable hot reload for both React and Electron
- Watch for file changes automatically
- Initialize Whisper.cpp for transcription

### Development-Only Web Version
To run just the React app in browser (without Electron):

```bash
npm run dev
```
Then open `http://localhost:5173` in your browser.

**Note**: Transcription features require the full Electron app.

### Development Features
- ✅ Hot reload for instant updates
- ✅ React DevTools available
- ✅ Tailwind CSS IntelliSense
- ✅ Automatic error reporting
- ✅ Source maps for debugging
- ✅ Local AI transcription (Whisper.cpp)

## 🏗 Building

### Build Web Version Only
```bash
npm run build:web
```
Output: `dist/` directory

### Build Electron App for Distribution
```bash
npm run build
```
This will:
1. Build the React app
2. Package it into an Electron app
3. Create distributable files

Output: `release/` directory

### Platform-Specific Builds
```bash
# Build for current platform only
npm run electron:dist

# Package without creating installer
npm run electron:pack
```

### Production Build Features
- ✅ Minified and optimized code
- ✅ Tree-shaking for smaller bundle size
- ✅ Asset optimization
- ✅ macOS app signing (when configured)
- ✅ Whisper.cpp binaries included

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server only |
| `npm run electron:dev` | Start both Vite and Electron in dev mode |
| `npm run setup:whisper` | Setup Whisper.cpp and AI models |
| `npm run setup:llama` | Setup Llama.cpp and AI models |
| `npm run verify:whisper` | Verify Whisper.cpp installation |
| `npm run build:web` | Build React app for web |
| `npm run build:electron` | Build Electron app only |
| `npm run build` | Build both web and Electron app |
| `npm run electron:pack` | Package Electron app (no installer) |
| `npm run electron:dist` | Create distributable Electron app |
| `npm run preview` | Preview built web version |

## 🎤 AI Transcription Features

### Whisper.cpp Integration
- **Local Processing** - All transcription happens on your device
- **High Performance** - 4-10x faster than cloud solutions
- **Privacy-First** - No audio data sent to external servers
- **Multiple Models** - Choose between speed and quality
- **Real-time** - Live transcription during dictation

### Supported Models
- **tiny.en** - Fastest, good for real-time processing
- **base.en** - Balanced speed and quality (default)
- **small.en** - Better quality, slightly slower
- **medium.en** - High quality for important dictations

### Audio Formats
- **Input**: WAV, MP3, FLAC, OGG
- **Sample Rate**: 16kHz (automatically converted)
- **Channels**: Mono (automatically converted)
- **Quality**: 16-bit PCM

## 🤖 AI Post-Processing Features

### Llama.cpp Integration
- **Local Processing** - All AI inference happens on your device
- **High Performance** - 4-10x faster than cloud solutions
- **Privacy-First** - No content data sent to external servers
- **Multiple Models** - Choose between speed and quality
- **Real-time** - Instant post-processing after dictation

### Use Case Detection & Formatting
- **Email** - Professional email formatting with greetings and signatures
- **Document** - Formal document structure with headers and formatting
- **Note** - Personal notes with bullet points and organization
- **Code** - Programming code with proper syntax and comments
- **Meeting** - Meeting notes with action items and speaker identification
- **Social Media** - Social media posts with appropriate tone and hashtags
- **Creative Writing** - Creative content with enhanced flow and style
- **Technical** - Technical documentation with proper terminology
- **Casual** - Casual conversation with natural flow

### Post-Processing Features
- **Use case detection** - Auto-detect content type from transcription
- **Formatting** - Apply appropriate formatting based on use case
- **Grammar correction** - Fix common speech-to-text errors
- **Structure organization** - Add proper paragraphs, lists, headers
- **Tone adjustment** - Match appropriate tone for use case
- **Content enhancement** - Expand abbreviations, add context

## ⌨️ Global Shortcuts

### Default Shortcuts
- `CmdOrCtrl+Shift+D` - Toggle dictation window
- `CmdOrCtrl+Shift+S` - Stop dictation
- `CmdOrCtrl+Shift+C` - Copy transcription
- `CmdOrCtrl+Shift+H` - Show/hide app

### Customization
All shortcuts can be customized in the app settings.

## 📁 Project Structure

```
romo/
├── 📁 electron/                 # Electron main process files
│   ├── main.js                  # Main Electron process
│   ├── preload.js               # Secure IPC preload script
│   └── 📁 services/             # Backend services
│       ├── whisperCppService.js # Whisper.cpp integration
│       └── llamaCppService.js   # Llama.cpp integration
├── 📁 src/                      # React application
│   ├── components/              # React components
│   │   └── dictation/           # Dictation-specific components
│   ├── stores/                  # State management (Zustand)
│   ├── utils/                   # Utility functions
│   └── App.jsx                  # Main React component
├── 📁 scripts/                  # Setup and build scripts
├── 📁 build/                    # Build assets and icons
└── 📁 release/                  # Distribution builds
```

## 🎯 Use Cases

### Professional Use
- **Email Composition** - Dictate professional emails with proper formatting
- **Document Creation** - Create formal documents with structured content
- **Meeting Notes** - Capture and organize meeting discussions
- **Technical Documentation** - Generate technical docs with proper terminology

### Personal Use
- **Quick Notes** - Capture thoughts and ideas quickly
- **Creative Writing** - Enhance creative content with AI assistance
- **Social Media** - Create engaging social media posts
- **Casual Communication** - Natural conversation transcription

## 🔒 Privacy & Security

- **100% Local Processing** - All AI models run on your device
- **No Cloud Dependencies** - No data sent to external servers
- **No Persistent Storage** - Transcriptions are not stored permanently
- **Secure IPC** - Secure communication between processes
- **Permission Control** - Only microphone access required

## 🚀 Performance

### Targets
- **Transcription latency**: < 500ms
- **Post-processing latency**: < 2 seconds
- **Memory usage**: < 200MB
- **CPU usage**: < 15% during dictation
- **Startup time**: < 3 seconds

### Optimization
- **Streaming transcription** - Real-time audio processing
- **Parallel processing** - Whisper + Llama.cpp working together
- **Memory management** - Efficient handling of long sessions
- **Background processing** - Non-blocking UI updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Whisper.cpp** - High-performance speech recognition
- **Llama.cpp** - Efficient language model inference
- **Electron** - Cross-platform desktop framework
- **React** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework

---

**Romo** - Intelligent dictation for the modern workflow.