const { spawn } = require('child_process')
const path = require('path')
const { EventEmitter } = require('events')
const fs = require('fs').promises
const os = require('os')
const http = require('http')

class LlamaCppService extends EventEmitter {
  constructor() {
    super()
    this.llamaBinary = null
    this.modelPath = null
    this.isInitialized = false
    this.isInitializing = false
    this.pendingRequests = new Map()
    this.requestId = 0
    this.serverProcess = null
    this.serverPort = 8080
    this.tempDir = os.tmpdir()
  }

  /**
   * Initialize the Llama.cpp service
   */
  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      return this.isInitialized
    }

    this.isInitializing = true

    try {
      // Find Llama.cpp binary
      await this.findLlamaBinary()

      // Find or download model
      await this.setupModel()

      // Start server mode for better performance
      await this.startServer()

      // Set initialized before testing
      this.isInitialized = true

      // Test the setup
      await this.testSetup()

      this.isInitializing = false

      console.log('Llama.cpp service initialized successfully')
      return true
    } catch (error) {
      this.isInitializing = false
      this.isInitialized = false
      console.error('Failed to initialize Llama.cpp service:', error)
      throw error
    }
  }

  /**
   * Find Llama.cpp binary
   */
  async findLlamaBinary() {
    const possiblePaths = [
      path.join(__dirname, '../../llama.cpp/build/bin/llama-server'),
      path.join(__dirname, '../../llama.cpp/build/bin/server'),
      path.join(__dirname, '../../llama.cpp/build/bin/main'),
      path.join(__dirname, '../../llama.cpp/server'),
      path.join(__dirname, '../../llama.cpp/main'),
      '/usr/local/bin/llama-server',
      '/opt/homebrew/bin/llama-server',
    ]

    for (const binaryPath of possiblePaths) {
      try {
        await fs.access(binaryPath, fs.constants.F_OK | fs.constants.X_OK)
        this.llamaBinary = binaryPath
        console.log(`Found Llama.cpp binary at: ${binaryPath}`)
        return
      } catch (error) {
        // Continue to next path
      }
    }

    throw new Error('Llama.cpp binary not found. Please build llama.cpp first.')
  }

  /**
   * Setup model file
   */
  async setupModel() {
    const modelDir = path.join(__dirname, '../../llama.cpp/models')
    const possibleModels = [
      'phi-2.Q4_K_M.gguf', // Preferred: Better for text tasks, less conversational
      'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf', // Fast alternative
      'mistral-7b-instruct-v0.2.Q4_K_M.gguf', // Fallback: More conversational
      'llama-2-7b-chat.Q4_K_M.gguf', // Fallback: Similar to Mistral
    ]

    for (const modelName of possibleModels) {
      const modelPath = path.join(modelDir, modelName)
      try {
        await fs.access(modelPath, fs.constants.F_OK)
        this.modelPath = modelPath
        console.log(`Found model: ${modelName}`)
        return
      } catch (error) {
        // Continue to next model
      }
    }

    throw new Error('No Llama models found. Please download a model first.')
  }

  /**
   * Start Llama.cpp server for better performance
   */
  async startServer() {
    if (this.serverProcess) {
      console.log('Server already running')
      return
    }

    const args = [
      '-m',
      this.modelPath,
      '--port',
      this.serverPort.toString(),
      '--ctx-size',
      '2048', // Reduced context size for performance
      '--threads',
      '2', // Reduced threads to prevent CPU overload
      '--n-gpu-layers',
      '0', // Disable GPU layers as they may cause issues
      '--repeat-penalty',
      '1.1',
      '--temp',
      '0.7',
      '--batch-size',
      '8', // Smaller batch size for faster response
    ]

    console.log(`Starting Llama.cpp server: ${this.llamaBinary} ${args.join(' ')}`)

    this.serverProcess = spawn(this.llamaBinary, args)

    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString()
      console.log('Llama.cpp server:', output)

      if (output.includes('HTTP server listening')) {
        console.log('Llama.cpp server ready')
      }
    })

    this.serverProcess.stderr.on('data', (data) => {
      console.log('Llama.cpp server stderr:', data.toString())
    })

    this.serverProcess.on('close', (code) => {
      console.log(`Llama.cpp server exited with code ${code}`)
      this.serverProcess = null
    })

    this.serverProcess.on('error', (error) => {
      console.error('Llama.cpp server error:', error)
      this.serverProcess = null
    })

    // Wait for server to start
    await this.waitForServer()
  }

  /**
   * Wait for server to be ready
   */
  async waitForServer() {
    const maxAttempts = 60 // Increased from 30 to 60
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        // Try to connect to the server port to check if it's listening
        const net = require('net')
        const socket = new net.Socket()

        await new Promise((resolve, reject) => {
          socket.setTimeout(2000) // Increased timeout to 2 seconds
          socket.on('connect', () => {
            socket.destroy()
            resolve()
          })
          socket.on('timeout', () => {
            socket.destroy()
            reject(new Error('Connection timeout'))
          })
          socket.on('error', () => {
            socket.destroy()
            reject(new Error('Connection failed'))
          })
          socket.connect(this.serverPort, '127.0.0.1')
        })

        console.log('Llama.cpp server is ready')
        return
      } catch (error) {
        attempts++
        console.log(`Waiting for Llama.cpp server... (${attempts}/${maxAttempts})`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    throw new Error('Llama.cpp server failed to start within timeout')
  }

  /**
   * Test the setup with a simple request
   */
  async testSetup() {
    console.log('Testing Llama.cpp setup...')

    try {
      // Wait much longer for the model to fully load and warm up
      console.log('Waiting for model to fully initialize...')
      await new Promise((resolve) => setTimeout(resolve, 10000)) // Increased to 10 seconds

      const testPrompt = 'hello this is a test'
      const response = await this.generateResponse(testPrompt)

      console.log('Llama.cpp test response:', response)

      if (response && response.length > 0) {
        console.log('Llama.cpp test successful')
        return true
      } else {
        throw new Error('Empty response from Llama.cpp')
      }
    } catch (error) {
      console.error('Llama.cpp test failed:', error)
      throw error
    }
  }

  /**
   * Generate response using Llama.cpp
   */
  async generateResponse(prompt) {
    if (!this.isInitialized) {
      throw new Error('Llama.cpp service not initialized')
    }

    const requestId = ++this.requestId

    try {
      // For transcript refinement, use direct prompt
      const response = await this.makeServerRequest(prompt)
      return response
    } catch (error) {
      console.error(`Error generating response ${requestId}:`, error)
      throw error
    }
  }

  /**
   * Build prompt for transcript refinement
   */
  buildTranscriptRefinementMessages(transcript) {
    return [
      {
        role: 'system',
        content:
          'Make the dictated transcript more accurate and complete. Do not change the content of the transcript. Only return the refined transcript.',
      },
      {
        role: 'user',
        content: `Here's the transcript: "${transcript}"`,
      },
    ]
  }

  /**
   * Make HTTP request using native Node.js http module
   */
  async makeHttpRequest(path, payload) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload)

      const options = {
        hostname: '127.0.0.1',
        port: this.serverPort,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      }

      const req = http.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            headers: new Map(Object.entries(res.headers)),
            text: async () => responseData,
            json: async () => JSON.parse(responseData),
          })
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.write(postData)
      req.end()
    })
  }

  /**
   * Make request to Llama.cpp server
   */
  async makeServerRequest(transcript) {
    const maxRetries = 3
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log('\n=== LLAMA.CPP REQUEST ===')
        console.log(`Attempt: ${attempt}/${maxRetries}`)
        console.log(`Transcript: "${transcript.substring(0, 100) + (transcript.length > 100 ? '...' : '')}"`)
        console.log('Request URL:', `http://127.0.0.1:${this.serverPort}/v1/chat/completions`)

        const messages = this.buildTranscriptRefinementMessages(transcript)
        const requestPayload = {
          model: 'gpt-3.5-turbo', // Model name is required but can be anything
          messages: messages,
          max_tokens: 500, // Reduced to prevent long responses
          temperature: 0.1, // Very low temperature for deterministic output
          top_p: 0.5, // More focused sampling
          stream: false,
        }

        // Use native Node.js HTTP instead of fetch
        console.log('Making HTTP request...')
        const response = await this.makeHttpRequest('/v1/chat/completions', requestPayload)
        console.log('HTTP request completed')

        if (response.status === 503) {
          console.log(`Server returned 503 (attempt ${attempt}), retrying...`)
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)) // Exponential backoff
          lastError = new Error(`Server temporarily unavailable (503) - attempt ${attempt}`)
          continue
        }

        console.log(`Response status: ${response.status} ${response.statusText}`)
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          const errorText = await response.text()
          console.log(`Error response body: ${errorText}`)
          throw new Error(`Server request failed: ${response.status} ${response.statusText}`)
        }

        // Parse JSON response
        const data = await response.json()
        console.log('\n=== LLAMA.CPP RESPONSE ===')
        console.log('Status:', response.status, response.statusText)
        console.log('Parsed JSON Data:')
        console.log(JSON.stringify(data, null, 2))

        // Extract content from OpenAI-compatible response format
        let content = ''
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          content = data.choices[0].message.content
          console.log('DEBUG - Found choices[0].message.content field')
        } else if (data.choices && data.choices[0] && data.choices[0].text) {
          content = data.choices[0].text
          console.log('DEBUG - Found choices[0].text field')
        } else {
          console.error('Unexpected response structure:', data)
          console.error('Available fields:', Object.keys(data))
          throw new Error('Could not extract content from response')
        }

        content =
          content
            .match(/"([^"]*)"/)
            ?.pop()
            ?.trim() || content.trim()

        console.log('\n=== LLAMA.CPP RESULT ===')
        console.log(`Success on attempt ${attempt}`)
        console.log(`Extracted content: "${content}"`)
        console.log('========================\n')

        return content
      } catch (error) {
        lastError = error
        console.error(`Llama.cpp request failed (attempt ${attempt}):`, error.message)

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        }
      }
    }

    throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError.message}`)
  }

  /**
   * Refine transcript text
   */
  async refineTranscript(transcript) {
    if (!transcript || transcript.trim().length === 0) {
      return 'No transcript provided for refinement.'
    }

    try {
      const response = await this.makeServerRequest(transcript)
      return response.trim()
    } catch (error) {
      console.error('Error refining transcript:', error)
      throw error
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    console.log('Shutting down Llama.cpp service...')

    if (this.serverProcess) {
      try {
        // First try graceful shutdown
        console.log('Sending SIGTERM to llama-server...')
        this.serverProcess.kill('SIGTERM')

        // Wait up to 5 seconds for graceful shutdown
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('SIGTERM timeout, force killing llama-server...')
            if (this.serverProcess) {
              this.serverProcess.kill('SIGKILL')
            }
            resolve()
          }, 5000)

          this.serverProcess.on('exit', () => {
            clearTimeout(timeout)
            console.log('Llama-server process exited')
            resolve()
          })
        })
      } catch (error) {
        console.error('Error during llama-server shutdown:', error)
      }

      this.serverProcess = null
    }

    this.isInitialized = false
    console.log('Llama.cpp service shutdown complete')
  }
}

module.exports = new LlamaCppService()
