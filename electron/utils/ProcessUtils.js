const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs').promises
const { BINARY_PATHS, MODEL_PATHS, TIMEOUTS } = require('./Constants.js')

/**
 * Common utilities for process management and binary discovery
 * Extracted from whisperCppService.js and llamaCppService.js
 */
class ProcessUtils {
  /**
   * Find binary executable from a list of possible paths
   * @param {string} serviceName - 'WHISPER' or 'LLAMA'
   * @param {string} baseDir - Base directory (usually __dirname)
   * @returns {Promise<string>} - Path to found binary
   */
  static async findBinary(serviceName, baseDir) {
    const possiblePaths = BINARY_PATHS[serviceName]

    // In production, check app resources first
    const isDev = process.env.IS_DEV === 'true'
    if (!isDev) {
      const { app } = require('electron')
      const resourcesPath = process.resourcesPath || app.getAppPath()

      // Check production resource paths first
      const productionPaths =
        serviceName === 'WHISPER'
          ? [
              path.join(resourcesPath, 'whisper.cpp', 'build', 'bin', 'whisper-cli'),
              path.join(resourcesPath, 'whisper.cpp', 'build', 'bin', 'main'),
            ]
          : [
              path.join(resourcesPath, 'llama.cpp', 'build', 'bin', 'llama-server'),
              path.join(resourcesPath, 'llama.cpp', 'build', 'bin', 'llama-cli'),
            ]

      for (const binaryPath of productionPaths) {
        try {
          await fs.access(binaryPath, fs.constants.F_OK | fs.constants.X_OK)
          console.log(`Found ${serviceName} binary in resources: ${binaryPath}`)
          return binaryPath
        } catch (error) {
          // Continue to next path
        }
      }
    }

    for (const relativePath of possiblePaths) {
      let binaryPath

      // Handle absolute paths vs relative paths
      if (path.isAbsolute(relativePath) || relativePath.includes('/')) {
        binaryPath = path.isAbsolute(relativePath) ? relativePath : path.join(baseDir, relativePath)
      } else {
        // This is a command name for PATH lookup
        binaryPath = relativePath
      }

      try {
        // For PATH lookup commands, try to execute with --help
        if (!binaryPath.includes('/')) {
          await ProcessUtils.testBinaryCommand(binaryPath)
          console.log(`Found ${serviceName} binary in PATH: ${binaryPath}`)
          return binaryPath
        }

        // For file paths, check if file exists and is executable
        await fs.access(binaryPath, fs.constants.F_OK | fs.constants.X_OK)
        console.log(`Found ${serviceName} binary at: ${binaryPath}`)
        return binaryPath
      } catch (error) {
        // Continue to next path
      }
    }

    throw new Error(`${serviceName} binary not found. Please build ${serviceName.toLowerCase()}.cpp first.`)
  }

  /**
   * Test if a binary command is available in PATH
   * @param {string} command - Command name to test
   * @returns {Promise<void>}
   */
  static async testBinaryCommand(command) {
    return new Promise((resolve, reject) => {
      const testProcess = spawn(command, ['--help'])

      let hasOutput = false
      testProcess.stdout.on('data', () => {
        hasOutput = true
      })
      testProcess.stderr.on('data', () => {
        hasOutput = true
      })

      testProcess.on('close', (code) => {
        if (hasOutput || code === 0) {
          resolve()
        } else {
          reject(new Error(`Command ${command} not found or failed`))
        }
      })

      testProcess.on('error', reject)

      // Timeout after 5 seconds
      setTimeout(() => {
        testProcess.kill()
        reject(new Error(`Command ${command} test timeout`))
      }, 5000)
    })
  }

  /**
   * Find model file from a list of possible models and directories
   * @param {string} serviceName - 'WHISPER' or 'LLAMA'
   * @param {string} baseDir - Base directory (usually __dirname)
   * @param {string} userDataPath - User data path for runtime resolution
   * @returns {Promise<string>} - Path to found model
   */
  static async findModel(serviceName, baseDir, userDataPath) {
    // In production, check app resources first
    const isDev = process.env.IS_DEV === 'true'
    let modelDirs = []

    if (!isDev) {
      const { app } = require('electron')
      const resourcesPath = process.resourcesPath || app.getAppPath()

      // Add production resource paths first
      if (serviceName === 'WHISPER') {
        modelDirs.push(path.join(resourcesPath, 'whisper.cpp', 'models'))
      } else {
        modelDirs.push(path.join(resourcesPath, 'llama.cpp', 'models'))
      }
    }

    // Add standard model directories
    modelDirs.push(
      ...MODEL_PATHS[serviceName].map((modelDir) => {
        if (modelDir === 'models') {
          // Special case: user data directory
          return path.join(userDataPath, 'models')
        } else if (path.isAbsolute(modelDir)) {
          return modelDir
        } else {
          return path.join(baseDir, modelDir)
        }
      })
    )

    // Add production paths for packaged app
    if (process.resourcesPath) {
      modelDirs.push(
        path.join(process.resourcesPath, `${serviceName.toLowerCase()}.cpp/models`),
        path.join(process.resourcesPath, `app.asar.unpacked/${serviceName.toLowerCase()}.cpp/models`)
      )
    }

    const models = require('./Constants.js').AI_MODELS[serviceName].PREFERRED_MODELS

    for (const modelDir of modelDirs) {
      for (const modelName of models) {
        const modelPath = path.join(modelDir, modelName)
        try {
          await fs.access(modelPath, fs.constants.F_OK)
          console.log(`Found ${serviceName} model: ${modelName} at ${modelPath}`)
          return modelPath
        } catch (error) {
          // Continue to next model/directory
        }
      }
    }

    throw new Error(`No ${serviceName} models found. Please download a model first.`)
  }

  /**
   * Spawn a process with enhanced error handling and logging
   * @param {string} binary - Binary path
   * @param {Array<string>} args - Arguments
   * @param {Object} options - Spawn options
   * @returns {ChildProcess} - Spawned process
   */
  static spawnWithLogging(binary, args, options = {}) {
    console.log(`Spawning process: ${binary} ${args.join(' ')}`)

    const process = spawn(binary, args, options)

    process.on('error', (error) => {
      console.error(`Process spawn error for ${binary}:`, error.message)
    })

    return process
  }

  /**
   * Wait for a server to be ready by testing connection
   * @param {number} port - Port number
   * @param {string} host - Host address (default: 127.0.0.1)
   * @param {number} maxAttempts - Maximum connection attempts
   * @param {number} timeout - Connection timeout per attempt
   * @returns {Promise<void>}
   */
  static async waitForServer(port, host = '127.0.0.1', maxAttempts = 60, timeout = 2000) {
    const net = require('net')
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        await new Promise((resolve, reject) => {
          const socket = new net.Socket()

          socket.setTimeout(timeout)
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

          socket.connect(port, host)
        })

        console.log(`Server is ready on ${host}:${port}`)
        return
      } catch (error) {
        attempts++
        console.log(`Waiting for server on ${host}:${port}... (${attempts}/${maxAttempts})`)
        await ProcessUtils.sleep(1000)
      }
    }

    throw new Error(`Server failed to start on ${host}:${port} within timeout`)
  }

  /**
   * Gracefully shutdown a process with SIGTERM then SIGKILL
   * @param {ChildProcess} process - Process to shutdown
   * @param {number} timeout - Timeout for graceful shutdown
   * @returns {Promise<void>}
   */
  static async gracefulShutdown(process, timeout = TIMEOUTS.SHUTDOWN_TIMEOUT) {
    if (!process) return

    return new Promise((resolve) => {
      console.log('Sending SIGTERM to process...')
      process.kill('SIGTERM')

      const forceKillTimeout = setTimeout(() => {
        console.log('SIGTERM timeout, force killing process...')
        if (process) {
          process.kill('SIGKILL')
        }
        resolve()
      }, timeout)

      process.on('exit', () => {
        clearTimeout(forceKillTimeout)
        console.log('Process exited gracefully')
        resolve()
      })
    })
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Retry an async operation with exponential backoff
   * @param {Function} operation - Async function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay for exponential backoff
   * @returns {Promise<any>} - Result of successful operation
   */
  static async retryWithBackoff(operation, maxRetries = 3, baseDelay = TIMEOUTS.RETRY_DELAY) {
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        console.error(`Operation failed (attempt ${attempt}/${maxRetries}):`, error.message)

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.log(`Retrying in ${delay}ms...`)
          await ProcessUtils.sleep(delay)
        }
      }
    }

    throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError.message}`)
  }
}

module.exports = ProcessUtils
