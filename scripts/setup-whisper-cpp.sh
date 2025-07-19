#!/bin/bash

# Setup script for Whisper.cpp integration
# This script downloads, builds Whisper.cpp and downloads models

set -e

echo "🚀 Setting up Whisper.cpp for Meeting Helper..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for required tools
echo "🔍 Checking dependencies..."

# Check for git
if ! command -v git &> /dev/null; then
    echo "❌ Error: git is required but not installed"
    exit 1
fi

# Check for make
if ! command -v make &> /dev/null; then
    echo "❌ Error: make is required but not installed"
    echo "   On macOS: xcode-select --install"
    echo "   On Ubuntu/Debian: sudo apt-get install build-essential"
    exit 1
fi

# Check for cmake (try to find it)
if command -v cmake &> /dev/null; then
    echo "✅ cmake found"
    USE_CMAKE=true
elif command -v brew &> /dev/null; then
    echo "📦 Installing cmake via Homebrew..."
    brew install cmake
    USE_CMAKE=true
else
    echo "⚠️  cmake not found, using make instead"
    USE_CMAKE=false
fi

# Download Whisper.cpp if not already present
if [ ! -d "whisper.cpp" ]; then
    echo "📥 Downloading Whisper.cpp..."
    git clone https://github.com/ggml-org/whisper.cpp.git
else
    echo "✅ Whisper.cpp already downloaded"
    echo "🔄 Updating Whisper.cpp..."
    cd whisper.cpp
    git pull origin master
    cd ..
fi

# Build Whisper.cpp
echo "🔨 Building Whisper.cpp..."
cd whisper.cpp

if [ "$USE_CMAKE" = true ]; then
    echo "   Using cmake build system..."
    cmake -B build -DCMAKE_BUILD_TYPE=Release
    cmake --build build -j $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
    
    # Check if build was successful
    if [ -f "build/bin/main" ] || [ -f "build/bin/whisper-cli" ]; then
        echo "✅ Whisper.cpp built successfully with cmake"
    else
        echo "❌ cmake build failed, trying make..."
        USE_CMAKE=false
    fi
fi

if [ "$USE_CMAKE" = false ]; then
    echo "   Using make build system..."
    make clean 2>/dev/null || true
    make -j $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
    
    # Check if build was successful
    if [ -f "main" ]; then
        echo "✅ Whisper.cpp built successfully with make"
    else
        echo "❌ Build failed"
        exit 1
    fi
fi

# Download models
echo "📦 Downloading Whisper models..."

# Create models directory if it doesn't exist
mkdir -p models

# Download base.en model (good balance of speed and quality)
if [ ! -f "models/ggml-base.en.bin" ]; then
    echo "   Downloading base.en model..."
    bash ./models/download-ggml-model.sh base.en
else
    echo "✅ base.en model already exists"
fi

# Download tiny.en model (fastest, for real-time processing)
if [ ! -f "models/ggml-tiny.en.bin" ]; then
    echo "   Downloading tiny.en model..."
    bash ./models/download-ggml-model.sh tiny.en
else
    echo "✅ tiny.en model already exists"
fi

# Optional: Download small.en model (better quality)
read -p "🤔 Download small.en model for better quality? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -f "models/ggml-small.en.bin" ]; then
        echo "   Downloading small.en model..."
        bash ./models/download-ggml-model.sh small.en
    else
        echo "✅ small.en model already exists"
    fi
fi

cd ..

# Test the installation
echo "🧪 Testing Whisper.cpp installation..."

# Find the binary
WHISPER_BINARY=""
if [ -f "whisper.cpp/build/bin/whisper-cli" ]; then
    WHISPER_BINARY="whisper.cpp/build/bin/whisper-cli"
elif [ -f "whisper.cpp/build/bin/main" ]; then
    WHISPER_BINARY="whisper.cpp/build/bin/main"
elif [ -f "whisper.cpp/main" ]; then
    WHISPER_BINARY="whisper.cpp/main"
else
    echo "❌ Could not find Whisper.cpp binary"
    exit 1
fi

# Test with help command
if $WHISPER_BINARY --help > /dev/null 2>&1; then
    echo "✅ Whisper.cpp installation test passed"
else
    echo "❌ Whisper.cpp installation test failed"
    exit 1
fi

# Create a simple test
echo "🎵 Running a quick transcription test..."
if [ -f "whisper.cpp/samples/jfk.wav" ]; then
    echo "   Testing with JFK sample..."
    $WHISPER_BINARY -m whisper.cpp/models/ggml-base.en.bin -f whisper.cpp/samples/jfk.wav --output-json --no-prints > /tmp/whisper_test.txt 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Transcription test passed"
        echo "   Sample output: $(head -1 /tmp/whisper_test.txt)"
    else
        echo "⚠️  Transcription test failed, but installation seems OK"
    fi
else
    echo "⚠️  No sample audio found, skipping transcription test"
fi

echo ""
echo "🎉 Whisper.cpp setup complete!"
echo ""
echo "📊 Installation Summary:"
echo "   Binary: $WHISPER_BINARY"
echo "   Models: whisper.cpp/models/"
ls -la whisper.cpp/models/ggml-*.bin 2>/dev/null || echo "   No models found"
echo ""
echo "🚀 You can now start your Electron app and it will use Whisper.cpp!"
echo "   The Python service in py_service/ is no longer needed."
echo ""
echo "💡 Tips:"
echo "   - The app will automatically find and use the Whisper.cpp binary"
echo "   - Models are loaded automatically (base.en is preferred)"
echo "   - Check the console for initialization messages"
echo "" 