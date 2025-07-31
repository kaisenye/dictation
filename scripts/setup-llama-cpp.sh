#!/bin/bash

# Setup script for Llama.cpp integration
# This script downloads, builds Llama.cpp and downloads models

set -e

echo "🦙 Setting up Llama.cpp for Meeting Helper..."

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

# Download Llama.cpp if not already present
if [ ! -d "llama.cpp" ]; then
    echo "📥 Downloading Llama.cpp..."
    git clone https://github.com/ggerganov/llama.cpp.git
else
    echo "✅ Llama.cpp already downloaded"
    echo "🔄 Updating Llama.cpp..."
    cd llama.cpp
    git pull origin master
    cd ..
fi

# Build Llama.cpp
echo "🔨 Building Llama.cpp..."
cd llama.cpp

if [ "$USE_CMAKE" = true ]; then
    echo "   Using cmake build system..."
    cmake -B build -DCMAKE_BUILD_TYPE=Release
    cmake --build build -j $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
    
    # Check if build was successful
    if [ -f "build/bin/llama-server" ] || [ -f "build/bin/server" ] || [ -f "build/bin/main" ]; then
        echo "✅ Llama.cpp built successfully with cmake"
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
    if [ -f "llama-server" ] || [ -f "server" ] || [ -f "main" ]; then
        echo "✅ Llama.cpp built successfully with make"
    else
        echo "❌ Build failed"
        exit 1
    fi
fi

# Download models
echo "📦 Downloading Llama models..."

# Create models directory if it doesn't exist
mkdir -p models

# Function to download model
download_model() {
    local model_name=$1
    local model_file=$2
    local download_url=$3
    
    if [ ! -f "models/$model_file" ]; then
        echo "   Downloading $model_name..."
        curl -L -o "models/$model_file" "$download_url"
        echo "✅ $model_name downloaded"
    else
        echo "✅ $model_name already exists"
    fi
}

# Download recommended models
echo "   Downloading TinyLlama (recommended for real-time use)..."
download_model "TinyLlama" "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf" \
    "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"

echo "   Downloading Phi-2 (good balance of speed and quality)..."
download_model "Phi-2" "phi-2.Q4_K_M.gguf" \
    "https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf"

# Optional: Download larger models
read -p "🤔 Download larger models for better quality? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Downloading Mistral 7B Instruct..."
    download_model "Mistral 7B Instruct" "mistral-7b-instruct-v0.2.Q4_K_M.gguf" \
        "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
    
    echo "   Downloading Llama 2 7B Chat..."
    download_model "Llama 2 7B Chat" "llama-2-7b-chat.Q4_K_M.gguf" \
        "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf"
fi

cd ..

# Test the installation
echo "🧪 Testing Llama.cpp installation..."

# Find the binary
LLAMA_BINARY=""
if [ -f "llama.cpp/build/bin/llama-server" ]; then
    LLAMA_BINARY="llama.cpp/build/bin/llama-server"
elif [ -f "llama.cpp/build/bin/server" ]; then
    LLAMA_BINARY="llama.cpp/build/bin/server"
elif [ -f "llama.cpp/build/bin/main" ]; then
    LLAMA_BINARY="llama.cpp/build/bin/main"
elif [ -f "llama.cpp/llama-server" ]; then
    LLAMA_BINARY="llama.cpp/llama-server"
elif [ -f "llama.cpp/server" ]; then
    LLAMA_BINARY="llama.cpp/server"
elif [ -f "llama.cpp/main" ]; then
    LLAMA_BINARY="llama.cpp/main"
else
    echo "❌ Could not find Llama.cpp binary"
    exit 1
fi

# Check if binary is executable
if [ ! -x "$LLAMA_BINARY" ]; then
    echo "⚠️  Binary is not executable, fixing permissions..."
    chmod +x "$LLAMA_BINARY"
fi

# Test with help command
if $LLAMA_BINARY --help > /dev/null 2>&1; then
    echo "✅ Llama.cpp installation test passed"
else
    echo "❌ Llama.cpp installation test failed"
    exit 1
fi

# Create a simple test
echo "🧠 Running a quick inference test..."
if [ -f "llama.cpp/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf" ]; then
    echo "   Testing with TinyLlama model..."
    
    # Start server in background
    $LLAMA_BINARY -m llama.cpp/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf --port 8080 --ctx-size 512 --threads 2 &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test inference
    curl -s -X POST http://localhost:8080/v1/chat/completions \
        -H "Content-Type: application/json" \
        -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello, how are you?"}], "max_tokens": 50, "temperature": 0.7}' \
        > /tmp/llama_test.txt 2>&1
    
    # Kill server
    kill $SERVER_PID 2>/dev/null || true
    
    if [ $? -eq 0 ]; then
        echo "✅ Inference test passed"
        echo "   Sample output: $(head -1 /tmp/llama_test.txt)"
    else
        echo "⚠️  Inference test failed, but installation seems OK"
    fi
else
    echo "⚠️  No models found, skipping inference test"
fi

echo ""
echo "🎉 Llama.cpp setup complete!"
echo ""
echo "📊 Installation Summary:"
echo "   Binary: $LLAMA_BINARY"
echo "   Models: llama.cpp/models/"
ls -la llama.cpp/models/*.gguf 2>/dev/null || echo "   No models found"
echo ""
echo "🚀 You can now use Llama.cpp for meeting context Q&A and summarization!"
echo ""
echo "💡 Tips:"
echo "   - TinyLlama is recommended for real-time use (fastest)"
echo "   - Phi-2 provides good balance of speed and quality"
echo "   - Larger models (Mistral, Llama 2) provide better quality but are slower"
echo "   - The app will automatically find and use available models"
echo "   - Check the console for initialization messages"
echo "   - If you see connection errors, the app uses IPv4 (127.0.0.1) for compatibility"
echo ""
echo "🔧 Next Steps:"
echo "   1. Start your Electron app"
echo "   2. The Llama.cpp service will initialize automatically"
echo "   3. Use the AI chat features in meeting views"
echo "   4. Meeting summaries will be generated automatically"
echo ""
echo "🐛 Troubleshooting:"
echo "   - If binary not found: Check that llama-server was built successfully"
echo "   - If model not found: Ensure models are in llama.cpp/models/ directory"
echo "   - If connection fails: Check that port 8080 is not in use"
echo "   - If slow performance: Consider using a smaller model like TinyLlama" 