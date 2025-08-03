const { EventEmitter } = require('events')
const os = require('os')
const ProcessUtils = require('../../utils/ProcessUtils')

/**
 * Base class for AI services that provides common functionality
 * Extracted common patterns from whisperCppService.js and llamaCppService.js
 */
class BaseAIService extends EventEmitter {
  constructor(serviceName) {
    super()
    this.serviceName = serviceName
    this.binary = null
    this.modelPath = null
    this.isInitialized = false
    this.isInitializing = false
    this.tempDir = os.tmpdir()
    this.requestId = 0
  }

  /**
   * Get the next request ID for logging/tracking
   * @returns {number}
   */
  getNextRequestId() {
    return ++this.requestId
  }

  /**
   * Generic initialization flow
   * Subclasses should override setupBinary() and setupModel()
   */
  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      return this.isInitialized
    }

    this.isInitializing = true

    try {
      console.log(`Initializing ${this.serviceName} service...`)

      // Find binary
      await this.setupBinary()

      // Find model
      await this.setupModel()

      // Run any additional setup
      await this.additionalSetup()

      // Test the setup
      await this.testSetup()

      this.isInitialized = true
      this.isInitializing = false

      console.log(`${this.serviceName} service initialized successfully`)
      return true
    } catch (error) {
      this.isInitializing = false
      this.isInitialized = false
      console.error(`Failed to initialize ${this.serviceName} service:`, error)
      throw error
    }
  }

  /**
   * Setup binary - to be implemented by subclasses
   * Should set this.binary
   */
  async setupBinary() {
    const { app } = require('electron')
    this.binary = await ProcessUtils.findBinary(this.serviceName.toUpperCase(), __dirname + '/../..')
  }

  /**
   * Setup model - to be implemented by subclasses
   * Should set this.modelPath
   */
  async setupModel() {
    const { app } = require('electron')
    this.modelPath = await ProcessUtils.findModel(
      this.serviceName.toUpperCase(),
      __dirname + '/../..',
      app.getPath('userData')
    )
  }

  /**
   * Additional setup - to be overridden by subclasses if needed
   * Called after binary and model setup, before testing
   */
  async additionalSetup() {
    // Default: no additional setup
  }

  /**
   * Test setup - to be implemented by subclasses
   * Should verify the service is working correctly
   */
  async testSetup() {
    console.log(`Testing ${this.serviceName} setup...`)
    // Subclasses should implement actual testing
    console.log(`${this.serviceName} test successful (base implementation)`)
  }

  /**
   * Check if the service is ready to use
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized && this.binary && this.modelPath
  }

  /**
   * Get service status information
   * @returns {Object}
   */
  getStatus() {
    return {
      serviceName: this.serviceName,
      initialized: this.isInitialized,
      binary: this.binary,
      modelPath: this.modelPath,
      ready: this.isReady(),
    }
  }

  /**
   * Shutdown the service - to be extended by subclasses
   */
  async shutdown() {
    console.log(`Shutting down ${this.serviceName} service...`)
    this.isInitialized = false
    console.log(`${this.serviceName} service shutdown complete`)
  }

  /**
   * Handle errors consistently across services
   * @param {string} operation - Operation that failed
   * @param {Error} error - The error
   * @param {any} context - Additional context for logging
   */
  handleError(operation, error, context = null) {
    const errorMessage = `${this.serviceName} ${operation} failed: ${error.message}`
    console.error(errorMessage, context ? { context } : '')

    // Emit error event for listeners
    this.emit('error', {
      operation,
      error,
      context,
      serviceName: this.serviceName,
    })

    return errorMessage
  }

  /**
   * Log operation success consistently
   * @param {string} operation - Operation that succeeded
   * @param {any} result - Operation result
   * @param {any} context - Additional context
   */
  logSuccess(operation, result = null, context = null) {
    const message = `${this.serviceName} ${operation} successful`
    console.log(message, result ? { result } : '', context ? { context } : '')

    // Emit success event for listeners
    this.emit('success', {
      operation,
      result,
      context,
      serviceName: this.serviceName,
    })
  }

  /**
   * Ensure service is initialized before operations
   * @param {string} operation - Operation name for error messages
   */
  ensureInitialized(operation) {
    if (!this.isInitialized) {
      throw new Error(`${this.serviceName} service not initialized for ${operation}`)
    }
  }

  /**
   * Create a temporary file path for operations
   * @param {string} prefix - File prefix
   * @param {string} extension - File extension
   * @returns {string} - Temporary file path
   */
  createTempFilePath(prefix, extension) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return require('path').join(this.tempDir, `${prefix}_${timestamp}_${random}.${extension}`)
  }

  /**
   * Execute an operation with retry logic
   * @param {Function} operation - Async operation to execute
   * @param {string} operationName - Name for logging
   * @param {number} maxRetries - Maximum retries
   * @returns {Promise<any>} - Operation result
   */
  async executeWithRetry(operation, operationName, maxRetries = 3) {
    const requestId = this.getNextRequestId()
    console.log(`${this.serviceName} ${operationName} (${requestId}) starting...`)

    try {
      const result = await ProcessUtils.retryWithBackoff(operation, maxRetries)
      this.logSuccess(`${operationName} (${requestId})`, result)
      return result
    } catch (error) {
      this.handleError(`${operationName} (${requestId})`, error)
      throw error
    }
  }
}

module.exports = BaseAIService
