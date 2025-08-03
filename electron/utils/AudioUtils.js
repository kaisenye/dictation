/**
 * AudioUtils - Centralized audio processing utilities
 * Simplifies WAV processing and buffer conversion
 */

class AudioUtils {
  // WAV format constants
  static WAV_CONSTANTS = {
    RIFF_ID: 'RIFF',
    WAVE_ID: 'WAVE',
    FMT_ID: 'fmt ',
    DATA_ID: 'data',
    HEADER_SIZE: 44,
    FMT_CHUNK_SIZE: 16,
    PCM_FORMAT: 1,
    MONO_CHANNELS: 1,
    BITS_PER_SAMPLE: 16,
    BYTES_PER_SAMPLE: 2
  }

  /**
   * Validate and normalize audio buffer from various input types
   * @param {string|ArrayBuffer|Buffer|TypedArray} audioData - Input audio data
   * @returns {Buffer} - Normalized buffer
   */
  static normalizeAudioBuffer(audioData) {
    if (!audioData) {
      throw new Error('Audio data is required')
    }

    let buffer
    if (typeof audioData === 'string') {
      buffer = Buffer.from(audioData, 'hex')
    } else if (ArrayBuffer.isView(audioData)) {
      // Handle TypedArray or DataView
      buffer = Buffer.from(audioData.buffer || audioData)
    } else if (audioData instanceof ArrayBuffer) {
      buffer = Buffer.from(audioData)
    } else if (Buffer.isBuffer(audioData)) {
      buffer = audioData
    } else {
      buffer = Buffer.from(audioData)
    }

    if (buffer.length === 0) {
      throw new Error('Audio buffer is empty')
    }

    return buffer
  }

  /**
   * Check if buffer is already a valid WAV file
   * @param {Buffer} buffer - Buffer to check
   * @returns {boolean} - True if already WAV format
   */
  static isWavBuffer(buffer) {
    return buffer.length > 12 && buffer.toString('ascii', 0, 4) === AudioUtils.WAV_CONSTANTS.RIFF_ID
  }

  /**
   * Calculate WAV file parameters
   * @param {number} dataSize - Size of audio data
   * @param {number} sampleRate - Sample rate (default 16000)
   * @param {number} channels - Number of channels (default 1)
   * @param {number} bitsPerSample - Bits per sample (default 16)
   * @returns {Object} - WAV parameters
   */
  static calculateWavParams(dataSize, sampleRate = 16000, channels = 1, bitsPerSample = 16) {
    const bytesPerSample = bitsPerSample / 8
    const blockAlign = channels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const fileSize = AudioUtils.WAV_CONSTANTS.HEADER_SIZE - 8 + dataSize // Subtract 8 for RIFF header
    
    return {
      sampleRate,
      channels,
      bitsPerSample,
      bytesPerSample,
      blockAlign,
      byteRate,
      dataSize,
      fileSize
    }
  }

  /**
   * Create WAV header buffer
   * @param {Object} params - WAV parameters from calculateWavParams
   * @returns {Buffer} - WAV header buffer
   */
  static createWavHeader(params) {
    const header = Buffer.alloc(AudioUtils.WAV_CONSTANTS.HEADER_SIZE)
    let offset = 0

    // RIFF header
    header.write(AudioUtils.WAV_CONSTANTS.RIFF_ID, offset, 'ascii')
    offset += 4
    header.writeUInt32LE(params.fileSize, offset)
    offset += 4
    header.write(AudioUtils.WAV_CONSTANTS.WAVE_ID, offset, 'ascii')
    offset += 4

    // fmt chunk
    header.write(AudioUtils.WAV_CONSTANTS.FMT_ID, offset, 'ascii')
    offset += 4
    header.writeUInt32LE(AudioUtils.WAV_CONSTANTS.FMT_CHUNK_SIZE, offset)
    offset += 4
    header.writeUInt16LE(AudioUtils.WAV_CONSTANTS.PCM_FORMAT, offset)
    offset += 2
    header.writeUInt16LE(params.channels, offset)
    offset += 2
    header.writeUInt32LE(params.sampleRate, offset)
    offset += 4
    header.writeUInt32LE(params.byteRate, offset)
    offset += 4
    header.writeUInt16LE(params.blockAlign, offset)
    offset += 2
    header.writeUInt16LE(params.bitsPerSample, offset)
    offset += 2

    // data chunk header
    header.write(AudioUtils.WAV_CONSTANTS.DATA_ID, offset, 'ascii')
    offset += 4
    header.writeUInt32LE(params.dataSize, offset)

    return header
  }

  /**
   * Create WAV buffer from raw audio data
   * Simplified version of the original WhisperCppService method
   * @param {string|ArrayBuffer|Buffer} audioData - Raw audio data
   * @param {number} sampleRate - Sample rate (default 16000)
   * @returns {Buffer} - Complete WAV buffer
   */
  static createWavBuffer(audioData, sampleRate = 16000) {
    // Normalize input to Buffer
    const buffer = AudioUtils.normalizeAudioBuffer(audioData)

    // If already WAV, return as-is
    if (AudioUtils.isWavBuffer(buffer)) {
      return buffer
    }

    // Ensure even length for 16-bit samples
    const dataSize = Math.floor(buffer.length / AudioUtils.WAV_CONSTANTS.BYTES_PER_SAMPLE) * AudioUtils.WAV_CONSTANTS.BYTES_PER_SAMPLE
    const audioBuffer = buffer.subarray(0, dataSize)

    // Calculate WAV parameters
    const params = AudioUtils.calculateWavParams(dataSize, sampleRate)

    // Create header
    const header = AudioUtils.createWavHeader(params)

    // Combine header and data
    return Buffer.concat([header, audioBuffer])
  }

  /**
   * Validate WAV buffer integrity
   * @param {Buffer} wavBuffer - WAV buffer to validate
   * @returns {Object} - Validation result {valid: boolean, error?: string}
   */
  static validateWavBuffer(wavBuffer) {
    if (!wavBuffer || wavBuffer.length < AudioUtils.WAV_CONSTANTS.HEADER_SIZE) {
      return { valid: false, error: 'WAV buffer too small' }
    }

    if (!AudioUtils.isWavBuffer(wavBuffer)) {
      return { valid: false, error: 'Invalid WAV header' }
    }

    return { valid: true }
  }

  /**
   * Get WAV file info from buffer
   * @param {Buffer} wavBuffer - WAV buffer
   * @returns {Object} - WAV file information
   */
  static getWavInfo(wavBuffer) {
    const validation = AudioUtils.validateWavBuffer(wavBuffer)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const channels = wavBuffer.readUInt16LE(22)
    const sampleRate = wavBuffer.readUInt32LE(24)
    const bitsPerSample = wavBuffer.readUInt16LE(34)
    const dataSize = wavBuffer.readUInt32LE(40)
    const duration = dataSize / (sampleRate * channels * (bitsPerSample / 8))

    return {
      channels,
      sampleRate,
      bitsPerSample,
      dataSize,
      duration,
      totalSize: wavBuffer.length
    }
  }
}

module.exports = AudioUtils