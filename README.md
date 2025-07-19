# Meeting Helper

A modern Electron app for Mac built with React, Vite, and Tailwind CSS to help you manage meetings more effectively with real-time AI transcription powered by Whisper.cpp and intelligent meeting assistance powered by Llama.cpp.

## 🚀 Features

- 📅 **Schedule Meetings** - Organize and plan your meetings efficiently
- 🎤 **Real-time Transcription** - AI-powered speech-to-text using Whisper.cpp
- 🤖 **AI Meeting Assistant** - Ask questions about meeting content using Llama.cpp
- 📝 **Auto-Summarization** - AI-generated meeting summaries
- 📝 **Take Notes** - Capture important points and action items
- ⏱️ **Track Time** - Keep meetings on schedule and productive
- 📊 **Analytics** - Review meeting insights and patterns
- 🔒 **Privacy-First** - All AI processing happens locally on your device

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
cd meeting-helper-2
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

# Setup Llama.cpp for AI chat and summarization
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
- **Real-time** - Live transcription during meetings

### Supported Models
- **tiny.en** - Fastest, good for real-time processing
- **base.en** - Balanced speed and quality (default)
- **small.en** - Better quality, slightly slower
- **medium.en** - High quality for important meetings

### Audio Formats
- **Input**: WAV, MP3, FLAC, OGG
- **Sample Rate**: 16kHz (automatically converted)
- **Channels**: Mono (automatically converted)
- **Quality**: 16-bit PCM

## 🤖 AI Meeting Assistant Features

### Llama.cpp Integration
- **Local Processing** - All AI inference happens on your device
- **High Performance** - 4-10x faster than cloud solutions
- **Privacy-First** - No conversation data sent to external servers
- **Multiple Models** - Choose between speed and quality
- **Real-time** - Instant responses during meetings

### AI Chat Interface
- **Contextual Q&A** - Ask questions about meeting content
- **Conversation Memory** - AI remembers previous questions
- **Smart Responses** - Understands meeting context and speakers
- **Real-time Updates** - Works with live transcription

### Auto-Summarization
- **Meeting Summaries** - AI-generated comprehensive summaries
- **Key Points Extraction** - Identifies important discussion points
- **Action Items** - Highlights tasks and decisions
- **Automatic Generation** - Creates summaries when meetings end

### Supported Models
- **TinyLlama** - Fastest, good for real-time chat (recommended)
- **Phi-2** - Good balance of speed and quality
- **Mistral 7B** - Better quality, slightly slower
- **Llama 2 7B** - High quality for important meetings

### Use Cases
- **Meeting Detail View**: Ask questions about completed meetings
- **Live Meeting View**: Get real-time insights during meetings
- **Summary Generation**: Automatic meeting summaries
- **Context Understanding**: AI understands speaker roles and conversation flow

## ⌨️ Keyboard Shortcuts

### macOS Native Shortcuts
- `Cmd+Q` - Quit application
- `Cmd+H` - Hide application
- `Cmd+M` - Minimize window
- `Cmd+W` - Close window
- `Cmd+R` - Reload application

### Custom App Shortcuts
- `Cmd+N` - Start new meeting
- `Cmd+O` - View past meetings
- `Cmd+,` - Open preferences (if implemented)

## 📁 Project Structure

```
meeting-helper-2/
├── 📁 electron/                 # Electron main process files
│   ├── main.js                  # Main Electron process
│   ├── preload.js               # Secure IPC preload script
│   └── 📁 services/             # Backend services
│       ├── whisperCppService.js # Whisper.cpp integration
│       └── llamaCppService.js   # Llama.cpp integration
├── 📁 src/                      # React application source
│   ├── App.jsx                  # Main React component
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Tailwind CSS + custom styles
│   └── 📁 components/           # React components
│       ├── 📁 meeting/          # Meeting-related components
│       └── 📁 ai/               # AI interface components
│           └── AIChatInterface.jsx # AI chat component
├── 📁 whisper.cpp/              # Whisper.cpp binaries and models
│   ├── build/bin/               # Compiled binaries
│   └── models/                  # AI models
├── 📁 llama.cpp/                # Llama.cpp binaries and models
│   ├── build/bin/               # Compiled binaries
│   └── models/                  # AI models
├── 📁 scripts/                  # Setup and utility scripts
│   ├── setup-whisper-cpp.sh     # Whisper.cpp setup script
│   └── setup-llama-cpp.sh       # Llama.cpp setup script
├── 📁 public/                   # Static assets
├── 📁 build/                    # Build assets (icons, etc.)
├── 📁 dist/                     # Web build output
├── 📁 dist-electron/            # Electron build output
├── 📁 release/                  # Final app distributables
├── index.html                   # HTML template
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── package.json                 # Dependencies and scripts
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
└── WHISPER_CPP_MIGRATION.md     # Migration guide
```

## 🔒 Security & Privacy

This app follows Electron security best practices and prioritizes privacy:

- ✅ **Context Isolation** - Enabled for secure IPC
- ✅ **Node Integration** - Disabled in renderer process
- ✅ **Preload Scripts** - Secure API exposure
- ✅ **External Links** - Handled safely
- ✅ **Content Security Policy** - Ready for implementation
- ✅ **Local AI Processing** - No audio data leaves your device
- ✅ **No Cloud Dependencies** - Works completely offline

## 🐛 Troubleshooting

### Common Issues

**1. "Module not found" errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**2. "Port 5173 already in use"**
```bash
# Kill process using the port
lsof -ti:5173 | xargs kill -9
```

**3. Electron app doesn't start**
```bash
# Check if Vite server is running first
npm run dev
# Then in another terminal
npm run electron
```

**4. Build fails**
```bash
# Clear build cache
rm -rf dist dist-electron
npm run build:web
```