import { useState, useRef, useCallback, useEffect } from 'react'

const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const chunksRef = useRef([])
  const recordingStartTimeRef = useRef(null)
  const totalProcessedTimeRef = useRef(0)
  const transcriptionBufferRef = useRef('') // Buffer for accumulating transcription

  // Track processed audio to prevent duplicates
  const processedAudioLengthRef = useRef(0)
  const lastProcessedTextRef = useRef('')

  // Audio level monitoring with improved sensitivity
  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteTimeDomainData(dataArray) // Use time domain for better voice detection

      // Calculate RMS (Root Mean Square) for better audio level detection
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const sample = (dataArray[i] - 128) / 128 // Convert to -1 to 1 range
        sum += sample * sample
      }
      const rms = Math.sqrt(sum / dataArray.length)

      // Apply logarithmic scaling and amplification for better visibility
      const level = Math.min(1, rms * 5) // Amplify by 5x and cap at 1
      setAudioLevel(level)

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }
  }, [])

  // Check if audio level indicates speech
  const hasSpeech = useCallback((audioData) => {
    if (!audioData || audioData.length === 0) return false

    // Calculate RMS of the audio data
    let sum = 0
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i]
    }
    const rms = Math.sqrt(sum / audioData.length)

    // Threshold for speech detection (adjust as needed)
    const speechThreshold = 0.01
    const hasSpeechDetected = rms > speechThreshold

    // Debug logging for first few chunks
    if (Math.random() < 0.1) {
      // Log 10% of the time to avoid spam
    }

    return hasSpeechDetected
  }, [])

  // Update transcription with deduplication
  const updateTranscription = useCallback((text) => {
    const newText = text.trim()

    // Skip if text is empty or already processed
    if (!newText || newText === lastProcessedTextRef.current) {
      return
    }

    // Add new text with proper spacing
    if (transcriptionBufferRef.current) {
      transcriptionBufferRef.current += ' ' + newText
    } else {
      transcriptionBufferRef.current = newText
    }

    // Update the dictation store
    if (window.useDictationStore) {
      window.useDictationStore.getState().updateTranscription(transcriptionBufferRef.current.trim())
    }

    // Track last processed text
    lastProcessedTextRef.current = newText
  }, [])

  // Improved audio processing with non-overlapping chunks
  const processAudioChunk = useCallback(
    async (audioData, sampleRate) => {
      try {
        if (window.electronAPI) {
          const status = await window.electronAPI.aiGetStatus()
          if (!status.initialized) {
            const initResult = await window.electronAPI.aiInitialize()
            if (!initResult.success) {
              throw new Error('Failed to initialize AI service: ' + initResult.error)
            }
          }

          setIsProcessing(true)

          const wavBuffer = createWavBuffer(audioData, sampleRate)
          const uint8Array = new Uint8Array(wavBuffer)
          const hexString = Array.from(uint8Array)
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('')

          const result = await window.electronAPI.processAudioChunk(hexString, sampleRate)

          if (result && result.success && result.result && result.result.text) {
            const text = result.result.text.trim()
            if (text && text !== '[BLANK_AUDIO]' && text.length > 0) {
              updateTranscription(text)
            }
          }
        }
      } catch (err) {
        console.error('Error processing audio chunk:', err)
        setError(`Audio processing error: ${err.message}`)
      } finally {
        setIsProcessing(false)
      }
    },
    [updateTranscription]
  )

  // Start recording with improved logic
  const startRecording = useCallback(async () => {
    try {
      if (isRecording) {
        console.warn('Recording is already active')
        return
      }

      setError(null)
      transcriptionBufferRef.current = ''
      lastProcessedTextRef.current = ''
      processedAudioLengthRef.current = 0
      recordingStartTimeRef.current = Date.now()
      totalProcessedTimeRef.current = 0

      // Request microphone access with better audio settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: false, // Disable for better raw audio
          noiseSuppression: false, // Disable for better raw audio
          autoGainControl: false, // Disable for consistent levels
          volume: 1.0,
        },
      })

      streamRef.current = stream

      // Set up audio context for level monitoring and raw audio capture
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      })

      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Optimize analyzer settings for voice detection
      analyserRef.current.fftSize = 2048 // Larger for better resolution
      analyserRef.current.smoothingTimeConstant = 0.3 // Less smoothing for responsiveness

      updateAudioLevel()

      // Set up MediaRecorder with WAV format (more reliable than WebM chunks)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus', // Keep WebM for full recording
        audioBitsPerSecond: 128000, // Higher bitrate for better quality
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Improved audio processing with non-overlapping chunks
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
      let audioBuffer = []
      let lastProcessTime = Date.now()
      const chunkSize = 64000 // 4 seconds at 16kHz (non-overlapping) - increased from 2 seconds for better context
      const processInterval = 4000 // Process every 4 seconds - increased from 2 seconds

      processor.onaudioprocess = async (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        audioBuffer.push(...inputData)

        // Process non-overlapping chunks
        if (audioBuffer.length >= chunkSize) {
          const now = Date.now()
          if (now - lastProcessTime >= processInterval) {
            lastProcessTime = now

            // Take exactly chunkSize samples (non-overlapping)
            const currentChunk = audioBuffer.slice(0, chunkSize)

            // Check for speech in this chunk
            const hasSpeechInChunk = hasSpeech(currentChunk)

            if (hasSpeechInChunk) {
              await processAudioChunk(currentChunk, 16000)
              processedAudioLengthRef.current += chunkSize
            }

            // Remove processed audio (non-overlapping approach)
            audioBuffer = audioBuffer.slice(chunkSize)
          }
        }
      }

      source.connect(processor)
      processor.connect(audioContextRef.current.destination)

      // Handle data available for full recording
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error)
        setError(`Recording error: ${event.error.message}`)
      }

      // Start recording with longer chunks for full recording
      mediaRecorder.start(10000) // 10 second chunks for full recording
      setIsRecording(true)
    } catch (err) {
      console.error('Error starting recording:', err)
      setError(err.message)
    }
  }, [updateAudioLevel, processAudioChunk, hasSpeech, isRecording])

  // Helper function to create WAV buffer from float32 audio data
  const createWavBuffer = (audioData, sampleRate) => {
    const length = audioData.length
    const buffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * 2, true)

    // Convert float32 to int16
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]))
      view.setInt16(offset, sample * 0x7fff, true)
      offset += 2
    }

    return buffer
  }

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      if (!mediaRecorderRef.current) {
        console.warn('No MediaRecorder to stop')
        setIsRecording(false)
        return
      }

      // Check if we're already in the process of stopping
      if (mediaRecorderRef.current.state === 'inactive') {
        console.warn('MediaRecorder is already stopped')
        setIsRecording(false)
        return
      }

      // Create a promise to wait for the MediaRecorder to stop
      const stopPromise = new Promise((resolve, reject) => {
        const originalOnStop = mediaRecorderRef.current.onstop
        const originalOnError = mediaRecorderRef.current.onerror

        mediaRecorderRef.current.onstop = () => {
          setIsRecording(false)
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }
          // Restore original handlers
          mediaRecorderRef.current.onstop = originalOnStop
          mediaRecorderRef.current.onerror = originalOnError
          resolve()
        }

        mediaRecorderRef.current.onerror = (event) => {
          console.error('MediaRecorder error during stop:', event.error)
          // Restore original handlers
          mediaRecorderRef.current.onstop = originalOnStop
          mediaRecorderRef.current.onerror = originalOnError
          reject(new Error(`MediaRecorder error: ${event.error.message}`))
        }
      })

      // Stop the MediaRecorder
      mediaRecorderRef.current.stop()

      // Wait for the MediaRecorder to actually stop
      await stopPromise

      // Clean up streams and contexts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      // Reset timestamp tracking
      recordingStartTimeRef.current = null
      totalProcessedTimeRef.current = 0

      setAudioLevel(0)
      mediaRecorderRef.current = null
    } catch (error) {
      console.error('Error stopping recording:', error)
      setError(`Failed to stop recording: ${error.message}`)
      // Force cleanup even if there was an error
      setIsRecording(false)
      setAudioLevel(0)
      mediaRecorderRef.current = null
      throw error
    }
  }, []) // Remove isRecording from dependencies to prevent recreation

  // Save complete recording
  const saveRecording = useCallback(async (meetingId) => {
    if (chunksRef.current.length === 0) {
      throw new Error('No audio data to save')
    }

    try {
      // Final AI refinement of complete transcription
      let finalText = transcriptionBufferRef.current.trim()
      if (window.electronAPI && window.electronAPI.llamaGetStatus && finalText) {
        try {
          const llamaStatus = await window.electronAPI.llamaGetStatus()
          if (llamaStatus.success && llamaStatus.initialized) {
            const prompt = `Clean up the following voice transcription by correcting grammar, punctuation, and formatting. Return ONLY the revised text—no explanations, no headings, and no comments:\n"${finalText}"`
            const result = await window.electronAPI.llamaAnswerQuestion(prompt, meetingId, [], [])
            // Only use the AI result if it's not empty and not just the prompt
            if (result.success && result.answer && result.answer.trim() && !result.answer.includes(prompt)) {
              finalText = result.answer.trim()
            }
          }
        } catch (finalRefineError) {
          console.warn('Final AI refinement failed:', finalRefineError.message)
        }
      }

      // Update the store with the final text
      if (window.useDictationStore) {
        window.useDictationStore.getState().updateTranscription(finalText)
        window.useDictationStore.getState().setProcessedTranscription('')
      }

      // Clear chunks since transcription was saved live
      chunksRef.current = []

      return { success: true, result: { text: 'Transcription saved during recording' } }
    } catch (err) {
      console.error('Error completing recording:', err)
      throw err
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  return {
    isRecording,
    isProcessing,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    saveRecording,
  }
}

export default useAudioRecording
