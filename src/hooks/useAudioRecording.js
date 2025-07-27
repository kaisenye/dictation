import { useState, useRef, useCallback, useEffect } from 'react'

const useAudioRecording = () => {
  console.log('=== useAudioRecording hook initialized ===')

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)

  console.log('=== Hook state initialized ===', { isRecording, isProcessing, error, audioLevel })

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const chunksRef = useRef([])
  const recordingStartTimeRef = useRef(null)
  const allAudioDataRef = useRef([])

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
    return rms > speechThreshold
  }, [])

  // No longer needed - we'll process all audio at once at the end

  // Start recording with improved logic
  const startRecording = useCallback(async () => {
    console.log('=== useAudioRecording startRecording called ===')
    console.log('Current isRecording state:', isRecording)
    try {
      if (isRecording) {
        console.warn('Recording is already active')
        return
      }

      setError(null)
      allAudioDataRef.current = []
      recordingStartTimeRef.current = Date.now()

      console.log('Requesting microphone access...')
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
      console.log('Microphone access granted successfully')

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

      // Simple audio collection - store all audio data for final processing
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        // Store all audio data for final processing
        allAudioDataRef.current.push(...inputData)
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
      console.log('Setting isRecording to true')
      setIsRecording(true)
      console.log('Recording started successfully!')
    } catch (err) {
      console.error('Error starting recording:', err)
      setError(err.message)
    }
  }, [updateAudioLevel, isRecording])

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

  // Save complete recording and process all audio at once
  const saveRecording = useCallback(async (meetingId) => {
    console.log('=== saveRecording called ===')
    console.log('Audio data length:', allAudioDataRef.current.length)

    if (allAudioDataRef.current.length === 0) {
      console.warn('No audio data to save')
      throw new Error('No audio data to save')
    }

    try {
      setIsProcessing(true)

      // Process all collected audio data
      const audioData = allAudioDataRef.current
      const sampleRate = 16000

      console.log(`Processing ${audioData.length} audio samples at ${sampleRate}Hz`)

      // Initialize AI service if needed
      if (window.electronAPI) {
        const status = await window.electronAPI.aiGetStatus()
        if (!status.initialized) {
          console.log('Initializing AI service...')
          const initResult = await window.electronAPI.aiInitialize()
          if (!initResult.success) {
            throw new Error('Failed to initialize AI service: ' + initResult.error)
          }
        }

        // Convert audio data to WAV format and process
        console.log('Converting audio to WAV format...')
        const wavBuffer = createWavBuffer(audioData, sampleRate)
        const uint8Array = new Uint8Array(wavBuffer)
        const hexString = Array.from(uint8Array)
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('')

        console.log('Sending audio to Whisper for transcription...')
        const result = await window.electronAPI.processAudioChunk(hexString, sampleRate)
        console.log('Whisper result:', result)

        let finalText = ''
        if (result && result.success && result.result && result.result.text) {
          finalText = result.result.text.trim()
          console.log('Raw transcription:', finalText)

          // AI refinement with Llama if available
          if (window.electronAPI.llamaGetStatus && finalText && finalText !== '[BLANK_AUDIO]') {
            try {
              console.log('Checking Llama status for refinement...')
              const llamaStatus = await window.electronAPI.llamaGetStatus()
              if (llamaStatus.success && llamaStatus.initialized) {
                console.log('Refining text with Llama...')
                const prompt = `Clean up the following voice transcription by correcting grammar, punctuation, and formatting. Return ONLY the revised text—no explanations, no headings, and no comments:\n"${finalText}"`
                const llamaResult = await window.electronAPI.llamaAnswerQuestion(prompt, meetingId, [], [])
                if (
                  llamaResult.success &&
                  llamaResult.answer &&
                  llamaResult.answer.trim() &&
                  !llamaResult.answer.includes(prompt)
                ) {
                  finalText = llamaResult.answer.trim()
                  console.log('Refined text:', finalText)
                }
              }
            } catch (refinementError) {
              console.warn('AI refinement failed:', refinementError.message)
            }
          }
        }

        // Auto-paste to focused input field
        if (finalText && finalText !== '[BLANK_AUDIO]') {
          console.log('Pasting text to focused input:', finalText)
          await pasteToFocusedInput(finalText)
        }

        // Update the store
        if (window.useDictationStore) {
          window.useDictationStore.getState().updateTranscription(finalText)
        }

        // Clear audio data
        allAudioDataRef.current = []
        chunksRef.current = []

        console.log('Recording processing completed successfully')
        return { success: true, result: { text: finalText } }
      }
    } catch (err) {
      console.error('Error processing complete recording:', err)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Helper function to paste text to focused input
  const pasteToFocusedInput = useCallback(async (text) => {
    try {
      if (window.electronAPI && window.electronAPI.pasteToFocusedApp) {
        console.log('Pasting to focused app:', text)
        const result = await window.electronAPI.pasteToFocusedApp(text)

        if (result.success) {
          console.log('Text pasted successfully to focused app')
          // Show brief notification
          if (window.electronAPI.showNotification) {
            await window.electronAPI.showNotification('Dictation Complete', `"${text}"`)
          }
        } else {
          console.warn('Failed to paste to focused app:', result.error)
          console.log('Transcribed text (copy manually):', text)
        }
      } else {
        console.warn('pasteToFocusedApp not available')
        console.log('Transcribed text (copy manually):', text)
      }
    } catch (error) {
      console.warn('Failed to paste to focused input:', error.message)
      console.log('Transcribed text (copy manually):', text)
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
