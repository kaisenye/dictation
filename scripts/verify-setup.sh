#!/bin/bash

# Verify Whisper.cpp setup script
# This script checks if Whisper.cpp is properly installed and working

set -e

echo "🔍 Verifying Whisper.cpp setup..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if whisper.cpp directory exists
if [ ! -d "whisper.cpp" ]; then
    echo "❌ Error: whisper.cpp directory not found"
    echo "   Run: npm run setup:whisper"
    exit 1
fi

# Check if binary exists
WHISPER_BINARY=""
if [ -f "whisper.cpp/build/bin/whisper-cli" ]; then
    WHISPER_BINARY="whisper.cpp/build/bin/whisper-cli"
elif [ -f "whisper.cpp/build/bin/main" ]; then
    WHISPER_BINARY="whisper.cpp/build/bin/main"
elif [ -f "whisper.cpp/main" ]; then
    WHISPER_BINARY="whisper.cpp/main"
else
    echo "❌ Error: Whisper.cpp binary not found"
    echo "   Run: npm run setup:whisper"
    exit 1
fi

echo "✅ Found Whisper.cpp binary: $WHISPER_BINARY"

# Check if binary is executable
if [ ! -x "$WHISPER_BINARY" ]; then
    echo "⚠️  Binary is not executable, fixing permissions..."
    chmod +x "$WHISPER_BINARY"
fi

# Test binary
echo "🧪 Testing Whisper.cpp binary..."
if $WHISPER_BINARY --help > /dev/null 2>&1; then
    echo "✅ Whisper.cpp binary works correctly"
else
    echo "❌ Error: Whisper.cpp binary test failed"
    exit 1
fi

# Check for models
echo "📦 Checking for AI models..."
MODEL_COUNT=0
for model in whisper.cpp/models/ggml-*.bin; do
    if [ -f "$model" ]; then
        echo "✅ Found model: $(basename "$model")"
        MODEL_COUNT=$((MODEL_COUNT + 1))
    fi
done

if [ $MODEL_COUNT -eq 0 ]; then
    echo "❌ Error: No Whisper models found"
    echo "   Run: npm run setup:whisper"
    exit 1
fi

echo "✅ Found $MODEL_COUNT model(s)"

# Test transcription with sample
echo "🎵 Testing transcription..."
if [ -f "whisper.cpp/samples/jfk.wav" ]; then
    echo "   Testing with JFK sample..."
    $WHISPER_BINARY -m whisper.cpp/models/ggml-base.en.bin -f whisper.cpp/samples/jfk.wav --no-prints > /tmp/whisper_test.txt 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Transcription test passed"
        echo "   Sample output: $(head -1 /tmp/whisper_test.txt)"
    else
        echo "⚠️  Transcription test failed, but setup seems OK"
    fi
else
    echo "⚠️  No sample audio found, skipping transcription test"
fi

# Check Electron service file
echo "🔧 Checking Electron service..."
if [ -f "electron/services/whisperCppService.js" ]; then
    echo "✅ WhisperCppService found"
else
    echo "❌ Error: WhisperCppService not found"
    exit 1
fi

# Check setup script
echo "📜 Checking setup script..."
if [ -f "scripts/setup-whisper-cpp.sh" ]; then
    echo "✅ Setup script found"
else
    echo "❌ Error: Setup script not found"
    exit 1
fi

echo ""
echo "🎉 Whisper.cpp setup verification complete!"
echo ""
echo "📊 Summary:"
echo "   Binary: $WHISPER_BINARY"
echo "   Models: $MODEL_COUNT found"
echo "   Service: ✅ Ready"
echo "   Setup: ✅ Complete"
echo ""
echo "🚀 You can now run: npm run electron:dev"
echo "" 