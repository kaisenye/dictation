# Romo

AI-powered dictation app for macOS. Records audio via global shortcuts, transcribes with Whisper.cpp, refines text with LLaMA.cpp, and auto-pastes results to any input field.

## Features

- **Global Shortcuts** - `Cmd+Shift+D` to start/stop recording
- **Minimal UI** - Tiny pill window that stays bottom-center
- **Auto-paste** - Refined text automatically pastes to focused app
- **Local AI** - Whisper.cpp + LLaMA.cpp run entirely on device
- **Text Refinement** - LLaMA.cpp improves grammar and formatting
- **Tray Icon** - Menu bar access and controls
- **Privacy-First** - No cloud dependencies or data collection

## Prerequisites

- **Node.js** 16+ and npm
- **macOS** (required for accessibility permissions)
- **Xcode Command Line Tools**: `xcode-select --install`

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup AI services**
   ```bash
   npm run setup:whisper
   npm run setup:llama
   ```

3. **Run the app**
   ```bash
   npm run electron:dev
   ```

## Usage

1. **Launch**: App shows as tiny pill at bottom center of screen
2. **Record**: Press `Cmd+Shift+D` to start recording (pill expands)
3. **Stop**: Press `Cmd+Shift+D` again to stop, transcribe, and refine
4. **Auto-paste**: Refined text automatically pastes to focused app
5. **Tray**: Access settings and controls from menu bar icon

## Build for Distribution

```bash
npm run electron:dist
```

Creates DMG installer in `release/` directory with all dependencies included.

## Shortcuts

- `Cmd+Shift+D` - Start/stop recording
- `Cmd+Shift+C` - Copy last transcription
- `Cmd+Shift+H` - Show/hide app

## Permissions

First launch will request:
- **Microphone** - For audio recording
- **Accessibility** - For auto-pasting to other apps

## Technical Details

- **Tech Stack**: Electron, React, Vite, Tailwind CSS
- **AI**: Whisper.cpp for speech-to-text, LLaMA.cpp for text refinement
- **Platform**: macOS only (uses Apple Events for pasting)

## License

MIT License - see [LICENSE](LICENSE) file for details.