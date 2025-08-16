const BaseAIService = require('./base/BaseAIService')
const ProcessUtils = require('../utils/ProcessUtils')
const HttpUtils = require('../utils/HttpUtils')
const { SERVER_CONFIG, AI_MODELS } = require('../utils/Constants')

class LlamaCppService extends BaseAIService {
  constructor() {
    super('Llama')
    this.llamaBinary = null // Alias for compatibility
    this.pendingRequests = new Map()
    this.serverProcess = null
    this.serverPort = SERVER_CONFIG.LLAMA.PORT // Was: 8080
  }

  /**
   * Setup binary using ProcessUtils
   * Overrides BaseAIService.setupBinary()
   */
  async setupBinary() {
    this.binary = await ProcessUtils.findBinary('LLAMA', __dirname)
    this.llamaBinary = this.binary // Keep alias for existing code compatibility
  }

  /**
   * Setup model using ProcessUtils
   * Overrides BaseAIService.setupModel()
   */
  async setupModel() {
    const { app } = require('electron')
    this.modelPath = await ProcessUtils.findModel('LLAMA', __dirname, app.getPath('userData'))
  }

  /**
   * Additional setup - start server mode
   * Overrides BaseAIService.additionalSetup()
   */
  async additionalSetup() {
    await this.startServer()
  }

  /**
   * Test setup - overrides BaseAIService.testSetup()
   * EXACT COPY from original implementation
   */
  async testSetup() {
    console.log('Testing Llama.cpp setup...')

    try {
      // Wait much longer for the model to fully load and warm up
      console.log('Waiting for model to fully initialize...')
      await ProcessUtils.sleep(AI_MODELS.LLAMA.MODEL_WARMUP_TIME) // Was: 10000

      const testPrompt = 'hello this is a test'
      // Use makeServerRequest directly to bypass initialization check during testing
      const response = await this.makeServerRequest(testPrompt)

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
   * Start Llama.cpp server for better performance
   * PRESERVES EXACT FUNCTIONALITY from original
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
      AI_MODELS.LLAMA.CONTEXT_SIZE.toString(), // Was: '2048'
      '--threads',
      AI_MODELS.LLAMA.THREADS.toString(), // Was: '2'
      '--n-gpu-layers',
      AI_MODELS.LLAMA.GPU_LAYERS.toString(), // Was: '0'
      '--repeat-penalty',
      AI_MODELS.LLAMA.REPEAT_PENALTY.toString(), // Was: '1.1'
      '--temp',
      AI_MODELS.LLAMA.TEMPERATURE.toString(), // Was: '0.7'
      '--batch-size',
      AI_MODELS.LLAMA.BATCH_SIZE.toString(), // Was: '8'
    ]

    console.log(`Starting Llama.cpp server: ${this.llamaBinary} ${args.join(' ')}`)

    this.serverProcess = ProcessUtils.spawnWithLogging(this.llamaBinary, args)

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

    // Wait for server to start using ProcessUtils
    await ProcessUtils.waitForServer(
      this.serverPort,
      SERVER_CONFIG.LLAMA.HOST, // Was: '127.0.0.1'
      SERVER_CONFIG.LLAMA.WAIT_ATTEMPTS, // Was: 60
      SERVER_CONFIG.LLAMA.TIMEOUT // Was: 2000
    )
  }

  /**
   * Generate response using Llama.cpp
   * PRESERVES EXACT FUNCTIONALITY from original
   */
  async generateResponse(prompt) {
    this.ensureInitialized('generateResponse')

    const requestId = this.getNextRequestId()

    try {
      // For transcript refinement, use direct prompt
      const response = await this.makeServerRequest(prompt)
      return response
    } catch (error) {
      this.handleError(`generateResponse (${requestId})`, error)
      throw error
    }
  }

  /**
   * Build prompt for transcript refinement
   * EXACT COPY from original implementation
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
   * Make request to Llama.cpp server
   * Refactored to use HttpUtils for cleaner HTTP handling
   */
  async makeServerRequest(transcript) {
    console.log('\n=== LLAMA.CPP REQUEST ===')
    console.log(`Transcript: "${transcript.substring(0, 100) + (transcript.length > 100 ? '...' : '')}"`)
    console.log('Request URL:', `http://${SERVER_CONFIG.LLAMA.HOST}:${this.serverPort}/v1/chat/completions`)

    try {
      const messages = this.buildTranscriptRefinementMessages(transcript)
      const requestPayload = HttpUtils.buildChatRequest(messages, {
        maxTokens: 500,
        temperature: 0.1,
        topP: 0.5
      })

      console.log('Making HTTP request...')
      const responseData = await HttpUtils.llamaServerRequest(
        this.serverPort,
        '/v1/chat/completions',
        requestPayload,
        SERVER_CONFIG.LLAMA.MAX_RETRIES
      )
      console.log('HTTP request completed')

      console.log('\n=== LLAMA.CPP RESPONSE ===')
      console.log('Parsed JSON Data:')
      console.log(JSON.stringify(responseData, null, 2))

      // Extract and clean content
      const rawContent = HttpUtils.extractChatContent(responseData)
      const content = HttpUtils.cleanContent(rawContent)

      console.log('\n=== LLAMA.CPP RESULT ===')
      console.log(`Extracted content: "${content}"`)
      console.log('========================\n')

      return content
    } catch (error) {
      console.error('Llama server request failed:', error.message)
      throw error
    }
  }

  /**
   * Refine transcript text
   * PRESERVES EXACT FUNCTIONALITY from original
   */
  async refineTranscript(transcript) {
    if (!transcript || transcript.trim().length === 0) {
      return 'No transcript provided for refinement.'
    }

    try {
      const response = await this.makeServerRequest(transcript)
      return response.trim()
    } catch (error) {
      this.handleError('refineTranscript', error)
      throw error
    }
  }

  /**
   * Process agent request - convert voice request to formatted content
   * PRESERVES EXACT FUNCTIONALITY from original
   */
  async processAgentRequest(transcript) {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('No transcript provided for agent processing')
    }

    try {
      console.log('\n🤖 AGENT MODE PROCESSING')
      console.log('Original transcript:', `"${transcript}"`)

      // Detect content type and build appropriate prompt
      const contentType = this.detectContentType(transcript)
      console.log('Detected content type:', contentType)

      const agentPrompt = this.buildAgentPrompt(transcript, contentType)

      // Generate content using the existing server request method
      const generatedContent = await this.makeServerRequest(agentPrompt)

      console.log('✅ AGENT PROCESSING SUCCESS')
      console.log(
        `Generated content: "${generatedContent.substring(0, 200) + (generatedContent.length > 200 ? '...' : '')}"`
      )
      console.log('================================\n')

      return {
        success: true,
        contentType: contentType,
        originalTranscript: transcript,
        generatedContent: generatedContent.trim(),
      }
    } catch (error) {
      console.error('❌ AGENT PROCESSING FAILED:', error.message)
      console.log('================================\n')

      return {
        success: false,
        error: error.message,
        fallbackContent: transcript,
        contentType: 'fallback',
      }
    }
  }

  /**
   * Detect content type from user's transcript
   * EXACT COPY from original implementation
   */
  detectContentType(transcript) {
    const text = transcript.toLowerCase()

    if (
      text.includes('email') ||
      text.includes('write to') ||
      text.includes('send to') ||
      text.includes('professor') ||
      text.includes('colleague')
    ) {
      return 'email'
    }
    if (
      text.includes('document') ||
      text.includes('report') ||
      text.includes('proposal') ||
      text.includes('memo') ||
      text.includes('letter')
    ) {
      return 'document'
    }
    if (text.includes('agenda') || text.includes('meeting') || text.includes('standup')) {
      return 'agenda'
    }
    if (text.includes('list') || text.includes('todo') || text.includes('checklist') || text.includes('tasks')) {
      return 'list'
    }
    if (text.includes('note') || text.includes('notes') || text.includes('summary')) {
      return 'note'
    }

    return 'general'
  }

  /**
   * Build agent prompt for content generation
   * EXACT COPY from original implementation
   */
  buildAgentPrompt(transcript, contentType) {
    const prompts = {
      email: `You are a professional email assistant. Convert this spoken request into a well-formatted email with subject line, proper greeting, clear body, and appropriate closing. Make it professional but friendly.\n\nRequest: "${transcript}"\n\nEmail:`,

      document: `You are a document creation assistant. Convert this request into a well-structured document with appropriate headers and formatting.\n\nRequest: "${transcript}"\n\nDocument:`,

      agenda: `You are a meeting agenda assistant. Convert this request into a professional meeting agenda with clear sections and structure.\n\nRequest: "${transcript}"\n\nAgenda:`,

      list: `You are a list creation assistant. Convert this request into a well-organized list with clear items and structure.\n\nRequest: "${transcript}"\n\nList:`,

      note: `You are a note-taking assistant. Convert this request into clear, organized notes with bullet points as appropriate.\n\nRequest: "${transcript}"\n\nNotes:`,

      general: `You are an intelligent writing assistant. Analyze this spoken request and create appropriate content that fulfills the user's intent with proper formatting.\n\nRequest: "${transcript}"\n\nContent:`,
    }

    return prompts[contentType] || prompts['general']
  }

  /**
   * Shutdown the service - enhanced with ProcessUtils
   */
  async shutdown() {
    console.log('Shutting down Llama.cpp service...')

    if (this.serverProcess) {
      await ProcessUtils.gracefulShutdown(this.serverProcess)
      this.serverProcess = null
    }

    await super.shutdown()
  }
}

module.exports = new LlamaCppService()