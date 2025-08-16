/**
 * ErrorUtils - Standardized error handling utilities
 * Provides consistent error handling patterns across the application
 */

class ErrorUtils {
  /**
   * Standard error response format for IPC operations
   * @param {string} operation - Operation that failed
   * @param {Error|string} error - Error object or message
   * @returns {Object} - Standardized error response
   */
  static createErrorResponse(operation, error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Failed to ${operation}:`, errorMessage)
    
    return {
      success: false,
      error: errorMessage,
      operation
    }
  }

  /**
   * Standard success response format for IPC operations
   * @param {any} data - Success data
   * @param {string} operation - Operation that succeeded (optional)
   * @returns {Object} - Standardized success response
   */
  static createSuccessResponse(data, operation = null) {
    const response = {
      success: true,
      ...data
    }
    
    if (operation) {
      response.operation = operation
    }
    
    return response
  }

  /**
   * Log and throw error with consistent formatting
   * @param {string} context - Context where error occurred
   * @param {Error|string} error - Error to log and throw
   * @param {Object} additionalInfo - Additional debug info (optional)
   */
  static logAndThrow(context, error, additionalInfo = null) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const fullMessage = `${context}: ${errorMessage}`
    
    console.error(fullMessage, additionalInfo || '')
    
    if (error instanceof Error) {
      // Preserve original error type but update message
      error.message = fullMessage
      throw error
    } else {
      throw new Error(fullMessage)
    }
  }

  /**
   * Log error without throwing (for non-critical errors)
   * @param {string} context - Context where error occurred
   * @param {Error|string} error - Error to log
   * @param {Object} additionalInfo - Additional debug info (optional)
   */
  static logError(context, error, additionalInfo = null) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`${context}: ${errorMessage}`, additionalInfo || '')
  }

  /**
   * Wrap async operation with consistent error handling
   * @param {Function} operation - Async operation to wrap
   * @param {string} context - Context description
   * @returns {Promise} - Promise that handles errors consistently
   */
  static async wrapAsync(operation, context) {
    try {
      return await operation()
    } catch (error) {
      ErrorUtils.logAndThrow(context, error)
    }
  }

  /**
   * Wrap IPC handler with standardized error responses
   * @param {Function} handler - IPC handler function
   * @param {string} operation - Operation name
   * @returns {Function} - Wrapped handler
   */
  static wrapIPCHandler(handler, operation) {
    return async (...args) => {
      try {
        const result = await handler(...args)
        return ErrorUtils.createSuccessResponse(result, operation)
      } catch (error) {
        return ErrorUtils.createErrorResponse(operation, error)
      }
    }
  }

  /**
   * Create validation error
   * @param {string} field - Field that failed validation
   * @param {string} message - Validation error message
   * @returns {Error} - Validation error
   */
  static createValidationError(field, message) {
    return new Error(`Validation failed for ${field}: ${message}`)
  }

  /**
   * Create timeout error
   * @param {string} operation - Operation that timed out
   * @param {number} timeout - Timeout value
   * @returns {Error} - Timeout error
   */
  static createTimeoutError(operation, timeout) {
    return new Error(`${operation} timed out after ${timeout}ms`)
  }
}

module.exports = ErrorUtils