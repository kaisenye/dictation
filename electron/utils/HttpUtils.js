/**
 * HttpUtils - Simplified HTTP request utilities
 * Standardizes HTTP operations without complex fetch-like wrapper
 */

const http = require('http')
const { HTTP_CONFIG } = require('./Constants')

class HttpUtils {
  /**
   * Make a simple HTTP POST request with JSON payload
   * @param {string} hostname - Target hostname
   * @param {number} port - Target port
   * @param {string} path - Request path
   * @param {Object} payload - JSON payload to send
   * @param {Object} options - Additional options
   * @returns {Promise<{status: number, data: any, headers: Object}>}
   */
  static async postJson(hostname, port, path, payload, options = {}) {
    const { timeout = HTTP_CONFIG.DEFAULT_TIMEOUT } = options
    
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload)
      
      const requestOptions = {
        hostname,
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...options.headers
        }
      }

      const req = http.request(requestOptions, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk.toString()
        })

        res.on('end', () => {
          try {
            const data = responseData ? JSON.parse(responseData) : null
            resolve({
              status: res.statusCode,
              data,
              headers: res.headers
            })
          } catch (parseError) {
            reject(new Error(`Failed to parse JSON response: ${parseError.message}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`))
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error(`HTTP request timeout after ${timeout}ms`))
      })

      req.setTimeout(timeout)
      req.write(postData)
      req.end()
    })
  }

  /**
   * Make HTTP request to local Llama.cpp server with retry logic
   * @param {number} port - Server port
   * @param {string} path - Request path
   * @param {Object} payload - Request payload
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<any>} - Response data
   */
  static async llamaServerRequest(port, path, payload, maxRetries = 3) {
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Llama HTTP request attempt ${attempt}/${maxRetries}`)
        
        const response = await HttpUtils.postJson('127.0.0.1', port, path, payload, {
          timeout: HTTP_CONFIG.AI_REQUEST_TIMEOUT
        })

        console.log(`HTTP Response: ${response.status}`)

        // Handle server temporarily unavailable
        if (response.status === 503) {
          const retryDelay = HTTP_CONFIG.EXPONENTIAL_BACKOFF_BASE * attempt // Exponential backoff
          console.log(`Server busy (503), retrying in ${retryDelay}ms...`)
          await HttpUtils.sleep(retryDelay)
          lastError = new Error(`Server temporarily unavailable (attempt ${attempt})`)
          continue
        }

        // Handle other HTTP errors
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`)
        }

        return response.data
      } catch (error) {
        lastError = error
        console.error(`Llama request failed (attempt ${attempt}):`, error.message)
        
        if (attempt < maxRetries) {
          const retryDelay = HTTP_CONFIG.RETRY_DELAY * attempt
          console.log(`Retrying in ${retryDelay}ms...`)
          await HttpUtils.sleep(retryDelay)
        }
      }
    }

    throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError.message}`)
  }

  /**
   * Extract content from OpenAI-compatible chat completion response
   * @param {Object} response - Response data from Llama.cpp server
   * @returns {string} - Extracted content text
   */
  static extractChatContent(response) {
    if (!response) {
      throw new Error('Empty response from server')
    }

    // Try OpenAI format first: choices[0].message.content
    if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      return response.choices[0].message.content.trim()
    }

    // Try alternative format: choices[0].text
    if (response.choices && response.choices[0] && response.choices[0].text) {
      return response.choices[0].text.trim()
    }

    // Try direct text field
    if (response.text) {
      return response.text.trim()
    }

    console.error('Unexpected response structure:', JSON.stringify(response, null, 2))
    console.error('Available fields:', Object.keys(response))
    throw new Error('Could not extract content from response')
  }

  /**
   * Clean up extracted content (remove quotes if present)
   * @param {string} content - Raw content string
   * @returns {string} - Cleaned content
   */
  static cleanContent(content) {
    if (!content) return ''
    
    // Remove surrounding quotes if present
    const quotedMatch = content.match(/^"(.*)"$/s)
    if (quotedMatch) {
      return quotedMatch[1].trim()
    }
    
    return content.trim()
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Build standard chat completion request payload
   * @param {Array} messages - Chat messages array
   * @param {Object} options - Request options
   * @returns {Object} - Request payload
   */
  static buildChatRequest(messages, options = {}) {
    return {
      model: options.model || 'gpt-3.5-turbo', // Required but can be anything for local server
      messages,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.1,
      top_p: options.topP || 0.5,
      stream: false,
      ...options.extra
    }
  }
}

module.exports = HttpUtils