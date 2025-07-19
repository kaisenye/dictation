const { spawn } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const os = require('os');

class WhisperCppService extends EventEmitter {
  constructor() {
    super();
    this.whisperBinary = null;
    this.modelPath = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.streamingProcess = null;
    this.tempDir = os.tmpdir();
  }

  /**
   * Initialize the Whisper.cpp service
   */
  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      return this.isInitialized;
    }

    this.isInitializing = true;

    try {
      // Find Whisper.cpp binary
      await this.findWhisperBinary();
      
      // Find or download model
      await this.setupModel();
      
      // Test the setup
      await this.testSetup();
      
      this.isInitialized = true;
      this.isInitializing = false;
      
      console.log('Whisper.cpp service initialized successfully');
      return true;
      
    } catch (error) {
      this.isInitializing = false;
      console.error('Failed to initialize Whisper.cpp service:', error);
      throw error;
    }
  }

  /**
   * Find Whisper.cpp binary
   */
  async findWhisperBinary() {
    const possiblePaths = [
      path.join(__dirname, '../../whisper.cpp/build/bin/whisper-cli'),
      path.join(__dirname, '../../whisper.cpp/build/bin/main'),
      path.join(__dirname, '../../whisper.cpp/main'),
      '/usr/local/bin/whisper-cli',
      '/opt/homebrew/bin/whisper-cli'
    ];

    for (const binaryPath of possiblePaths) {
      try {
        await fs.access(binaryPath, fs.constants.F_OK | fs.constants.X_OK);
        this.whisperBinary = binaryPath;
        console.log(`Found Whisper.cpp binary at: ${binaryPath}`);
        return;
      } catch (error) {
        // Continue to next path
      }
    }

    throw new Error('Whisper.cpp binary not found. Please build whisper.cpp first.');
  }

  /**
   * Setup model file
   */
  async setupModel() {
    const modelDir = path.join(__dirname, '../../whisper.cpp/models');
    const possibleModels = [
      'ggml-base.en.bin',
      'ggml-base.bin',
      'ggml-small.en.bin',
      'ggml-tiny.en.bin'
    ];

    for (const modelName of possibleModels) {
      const modelPath = path.join(modelDir, modelName);
      try {
        await fs.access(modelPath, fs.constants.F_OK);
        this.modelPath = modelPath;
        console.log(`Found model: ${modelName}`);
        return;
      } catch (error) {
        // Continue to next model
      }
    }

    throw new Error('No Whisper models found. Please download a model first.');
  }

  /**
   * Test the setup with a simple command
   */
  async testSetup() {
    return new Promise((resolve, reject) => {
      const process = spawn(this.whisperBinary, ['--help']);
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Whisper.cpp test failed with code ${code}`));
        }
      });
      
      process.on('error', (error) => {
        reject(new Error(`Failed to run Whisper.cpp: ${error.message}`));
      });
    });
  }

  /**
   * Process complete audio file
   */
  async processAudioFile(audioFilePath) {
    if (!this.isInitialized) {
      throw new Error('Whisper.cpp service not initialized');
    }

    try {
      const result = await this.runWhisperCpp(audioFilePath, {
        language: 'en',
        threads: 4,
        bestOf: 5 // Higher quality for file processing
      });
      
      return this.formatResult(result);
      
    } catch (error) {
      console.error('Error processing audio file:', error);
      throw error;
    }
  }

  /**
   * Process audio chunk for real-time transcription
   */
  async processAudioChunk(audioBuffer, sampleRate = 16000) {
    if (!this.isInitialized) {
      throw new Error('Whisper.cpp service not initialized');
    }

    const requestId = ++this.requestId;
    
    try {
      // Write audio to temporary WAV file
      const tempFile = await this.writeAudioToTempFile(audioBuffer, sampleRate);
      
      // Run Whisper.cpp with JSON output for better segment parsing
      const result = await this.runWhisperCpp(tempFile, {
        outputFormat: 'json',
        language: 'en',
        threads: 4
      });
      
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}); // Ignore cleanup errors
      
      return this.formatResult(result);
      
    } catch (error) {
      console.error(`Error processing audio chunk ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Write audio buffer to temporary WAV file
   */
  async writeAudioToTempFile(audioBuffer, sampleRate = 16000) {
    const tempFile = path.join(this.tempDir, `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`);
    
    // Convert audio buffer to WAV format
    const wavBuffer = this.createWavBuffer(audioBuffer, sampleRate);
    await fs.writeFile(tempFile, wavBuffer);
    
    return tempFile;
  }

  /**
   * Create WAV buffer from audio data
   */
  createWavBuffer(audioData, sampleRate = 16000) {
    // Convert hex string to buffer if needed
    let buffer;
    if (typeof audioData === 'string') {
      buffer = Buffer.from(audioData, 'hex');
    } else {
      buffer = Buffer.from(audioData);
    }
    
    // If the buffer is already a WAV file, return it
    if (buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF') {
      return buffer;
    }
    
    // Create WAV header for raw PCM data
    const numChannels = 1; // Mono
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = buffer.length;
    const fileSize = 36 + dataSize;
    
    const wavHeader = Buffer.alloc(44);
    let offset = 0;
    
    // RIFF header
    wavHeader.write('RIFF', offset); offset += 4;
    wavHeader.writeUInt32LE(fileSize, offset); offset += 4;
    wavHeader.write('WAVE', offset); offset += 4;
    
    // fmt chunk
    wavHeader.write('fmt ', offset); offset += 4;
    wavHeader.writeUInt32LE(16, offset); offset += 4; // PCM chunk size
    wavHeader.writeUInt16LE(1, offset); offset += 2;  // PCM format
    wavHeader.writeUInt16LE(numChannels, offset); offset += 2;
    wavHeader.writeUInt32LE(sampleRate, offset); offset += 4;
    wavHeader.writeUInt32LE(byteRate, offset); offset += 4;
    wavHeader.writeUInt16LE(blockAlign, offset); offset += 2;
    wavHeader.writeUInt16LE(bitsPerSample, offset); offset += 2;
    
    // data chunk
    wavHeader.write('data', offset); offset += 4;
    wavHeader.writeUInt32LE(dataSize, offset);
    
    // Combine header and data
    return Buffer.concat([wavHeader, buffer]);
  }

  /**
   * Run Whisper.cpp with given options
   */
  async runWhisperCpp(audioFile, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        '-m', this.modelPath,
        '-f', audioFile
      ];

      // Add options
      if (options.outputFormat === 'json') {
        args.push('--output-json');
      }
      
      if (options.language) {
        args.push('-l', options.language);
      }
      
      if (options.threads) {
        args.push('-t', options.threads.toString());
      }
      
      if (options.bestOf) {
        args.push('--best-of', options.bestOf.toString());
      }
      
      // Suppress prints to get clean output
      args.push('--no-prints');

      console.log(`Running: ${this.whisperBinary} ${args.join(' ')}`);
      
      const process = spawn(this.whisperBinary, args);
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        const dataStr = data.toString();
        console.log('Whisper.cpp stdout:', dataStr);
        output += dataStr;
      });
      
      process.stderr.on('data', (data) => {
        const dataStr = data.toString();
        console.log('Whisper.cpp stderr:', dataStr);
        errorOutput += dataStr;
      });
      
      process.on('close', (code) => {
        console.log(`Whisper.cpp process closed with code: ${code}`);
        console.log('Final output:', output);
        console.log('Final error output:', errorOutput);
        
        if (code === 0) {
          try {
            // Try to parse as JSON first
            if (options.outputFormat === 'json') {
              const result = JSON.parse(output);
              console.log('Parsed JSON result:', result);
              resolve(result);
            } else {
              // Parse plain text output
              const result = this.parsePlainTextOutput(output);
              console.log('Parsed plain text result:', result);
              resolve(result);
            }
          } catch (parseError) {
            console.error('Failed to parse Whisper.cpp output:', output);
            
            // Fallback: try to parse as plain text even if JSON was requested
            try {
              const result = this.parsePlainTextOutput(output);
              console.log('Fallback parsed result:', result);
              resolve(result);
            } catch (fallbackError) {
              reject(new Error(`Failed to parse output: ${parseError.message}`));
            }
          }
        } else {
          console.error(`Whisper.cpp stderr: ${errorOutput}`);
          reject(new Error(`Whisper.cpp failed with code ${code}: ${errorOutput}`));
        }
      });
      
      process.on('error', (error) => {
        console.error('Whisper.cpp process error:', error);
        reject(new Error(`Failed to spawn Whisper.cpp: ${error.message}`));
      });
    });
  }

  /**
   * Parse plain text output from Whisper.cpp
   */
  parsePlainTextOutput(output) {
    const lines = output.trim().split('\n');
    const segments = [];
    let fullText = '';
    
    for (const line of lines) {
      // Match timestamp format: [00:00:00.000 --> 00:00:04.000] text
      const match = line.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\]\s*(.*)/);
      
      if (match) {
        const [, start, end, text] = match;
        const startTime = this.parseTimestamp(start);
        const endTime = this.parseTimestamp(end);
        
        segments.push({
          start: startTime,
          end: endTime,
          text: text.trim(),
          speaker: 'speaker_0' // Default speaker ID
        });
        
        fullText += text.trim() + ' ';
      } else if (line.trim() && !line.startsWith('[')) {
        // Handle lines without timestamps (just text)
        fullText += line.trim() + ' ';
      }
    }
    
    return {
      text: fullText.trim(),
      segments: segments,
      language: 'en'
    };
  }

  /**
   * Parse timestamp string to seconds
   */
  parseTimestamp(timestamp) {
    const parts = timestamp.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2]);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Format result to match the expected format
   */
  formatResult(whisperResult) {
    // Ensure each segment has a speaker field
    const segments = (whisperResult.segments || []).map(segment => ({
      ...segment,
      speaker: segment.speaker || 'speaker_0'
    }));
    
    return {
      text: whisperResult.text || '',
      segments: segments,
      language: whisperResult.language || 'en'
    };
  }

  /**
   * Start streaming mode for real-time processing
   */
  async startStreaming() {
    if (!this.isInitialized) {
      throw new Error('Whisper.cpp service not initialized');
    }

    if (this.streamingProcess) {
      console.log('Streaming already started');
      return;
    }

    const args = [
      '-m', this.modelPath,
      '--stream',
      '--step', '3000',  // 3 second steps
      '--length', '5000', // 5 second context
      '--audio-ctx', '512',
      '--no-prints'
    ];

    this.streamingProcess = spawn(this.whisperBinary, args);
    
    this.streamingProcess.stdout.on('data', (data) => {
      try {
        const result = JSON.parse(data.toString());
        this.emit('streamResult', this.formatResult(result));
      } catch (error) {
        console.error('Failed to parse streaming result:', error);
      }
    });

    this.streamingProcess.on('close', (code) => {
      console.log(`Streaming process exited with code ${code}`);
      this.streamingProcess = null;
    });

    this.streamingProcess.on('error', (error) => {
      console.error('Streaming process error:', error);
      this.streamingProcess = null;
    });
  }

  /**
   * Stop streaming mode
   */
  async stopStreaming() {
    if (this.streamingProcess) {
      this.streamingProcess.kill('SIGTERM');
      this.streamingProcess = null;
    }
  }

  /**
   * Send audio data to streaming process
   */
  streamAudioChunk(audioBuffer) {
    if (this.streamingProcess && this.streamingProcess.stdin) {
      this.streamingProcess.stdin.write(audioBuffer);
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized && this.whisperBinary && this.modelPath;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      whisperBinary: this.whisperBinary,
      modelPath: this.modelPath,
      streaming: !!this.streamingProcess
    };
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    await this.stopStreaming();
    
    // Clean up any pending requests
    this.pendingRequests.clear();
    
    this.isInitialized = false;
    console.log('Whisper.cpp service shutdown complete');
  }
}

// Create singleton instance
const whisperCppService = new WhisperCppService();

module.exports = whisperCppService; 