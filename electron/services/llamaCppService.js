const { spawn } = require('child_process')
const path = require('path')
const { EventEmitter } = require('events')
const fs = require('fs').promises
const os = require('os')

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
    this.conversationHistory = new Map() // meetingId -> conversation history
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
      'llama-2-7b-chat.Q4_K_M.gguf',
      'llama-2-7b-chat.Q4_0.gguf',
      'llama-2-7b.Q4_K_M.gguf',
      'llama-2-7b.Q4_0.gguf',
      'mistral-7b-instruct-v0.2.Q4_K_M.gguf',
      'mistral-7b-instruct-v0.1.Q4_K_M.gguf',
      'phi-2.Q4_K_M.gguf',
      'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
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
      '4096',
      '--threads',
      '4',
      '--n-gpu-layers',
      '1', // Use GPU if available
      '--repeat-penalty',
      '1.1',
      '--temp',
      '0.7',
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
      // Wait a bit more for the server to fully initialize
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const testPrompt = "Hello, this is a test. Please respond with 'Test successful'."
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
  async generateResponse(prompt, meetingId = null, context = null) {
    if (!this.isInitialized) {
      throw new Error('Llama.cpp service not initialized')
    }

    const requestId = ++this.requestId

    try {
      // Build conversation context
      let fullPrompt = this.buildPrompt(prompt, meetingId, context)

      // Make request to server
      const response = await this.makeServerRequest(fullPrompt)

      // Update conversation history
      if (meetingId) {
        this.updateConversationHistory(meetingId, prompt, response)
      }

      return response
    } catch (error) {
      console.error(`Error generating response ${requestId}:`, error)
      throw error
    }
  }

  /**
   * Build prompt with context
   */
  buildPrompt(prompt, meetingId, context) {
    let fullPrompt = ''

    // Add system instruction
    fullPrompt += 'You are a helpful AI assistant that helps users understand meeting conversations. '
    fullPrompt += 'You can answer questions about meeting content, provide summaries, and help with follow-up actions. '
    fullPrompt += 'Be concise, accurate, and helpful.\n\n'

    // Add meeting context if available
    if (context && context.transcripts && context.transcripts.length > 0) {
      fullPrompt += 'Meeting Context:\n'
      context.transcripts.forEach((transcript, index) => {
        const speaker =
          context.speakers?.find((s) => s.id === transcript.speaker_id)?.display_name ||
          transcript.speaker_id ||
          'Unknown'
        fullPrompt += `${speaker}: ${transcript.text}\n`
      })
      fullPrompt += '\n'
    }

    // Add conversation history
    if (meetingId && this.conversationHistory.has(meetingId)) {
      const history = this.conversationHistory.get(meetingId)
      if (history.length > 0) {
        fullPrompt += 'Previous conversation:\n'
        history.slice(-3).forEach(([user, assistant]) => {
          fullPrompt += `User: ${user}\nAssistant: ${assistant}\n`
        })
        fullPrompt += '\n'
      }
    }

    // Add current prompt
    fullPrompt += `User: ${prompt}\nAssistant:`

    return fullPrompt
  }

  /**
   * Make request to Llama.cpp server
   */
  async makeServerRequest(prompt) {
    const maxRetries = 3
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Making Llama.cpp request (attempt ${attempt}/${maxRetries})`)

        const response = await fetch(`http://127.0.0.1:${this.serverPort}/completion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            n_predict: 512,
            temperature: 0.7,
            top_p: 0.9,
            repeat_penalty: 1.1,
            stop: ['User:', '\n\n'],
          }),
        })

        if (response.status === 503) {
          console.log(`Server returned 503 (attempt ${attempt}), retrying...`)
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)) // Exponential backoff
          lastError = new Error(`Server temporarily unavailable (503) - attempt ${attempt}`)
          continue
        }

        if (!response.ok) {
          throw new Error(`Server request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const content = data.content || data.response || 'No response generated'

        console.log(`Llama.cpp request successful (attempt ${attempt})`)
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
   * Update conversation history
   */
  updateConversationHistory(meetingId, userPrompt, assistantResponse) {
    if (!this.conversationHistory.has(meetingId)) {
      this.conversationHistory.set(meetingId, [])
    }

    const history = this.conversationHistory.get(meetingId)
    history.push([userPrompt, assistantResponse])

    // Keep only last 10 exchanges to manage memory
    if (history.length > 10) {
      history.splice(0, history.length - 10)
    }
  }

  /**
   * Generate meeting summary
   */
  async generateMeetingSummary(meetingId, transcripts, speakers) {
    if (!transcripts || transcripts.length === 0) {
      return 'No meeting content available for summarization.'
    }

    const context = { transcripts, speakers }
    const summaryPrompt =
      'Please provide a comprehensive summary of this meeting, including key points discussed, decisions made, and any action items mentioned. Format the summary in a clear, structured way.'

    try {
      const summary = await this.generateResponse(summaryPrompt, meetingId, context)
      return summary
    } catch (error) {
      console.error('Error generating meeting summary:', error)
      throw error
    }
  }

  /**
   * Answer question about meeting context
   */
  async answerMeetingQuestion(question, meetingId, transcripts, speakers) {
    const context = { transcripts, speakers }

    try {
      const answer = await this.generateResponse(question, meetingId, context)
      return answer
    } catch (error) {
      console.error('Error answering meeting question:', error)
      throw error
    }
  }

  /**
   * Clear conversation history for a meeting
   */
  clearConversationHistory(meetingId) {
    this.conversationHistory.delete(meetingId)
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    console.log('Shutting down Llama.cpp service...')

    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM')
      this.serverProcess = null
    }

    this.isInitialized = false
    this.conversationHistory.clear()

    console.log('Llama.cpp service shutdown complete')
  }
}

module.exports = new LlamaCppService()
