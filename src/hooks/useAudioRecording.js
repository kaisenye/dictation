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
      console.log(`Audio RMS: ${rms.toFixed(4)}, Threshold: ${speechThreshold}, Has Speech: ${hasSpeechDetected}`)
    }

    return hasSpeechDetected
  }, [])

  // Update transcription in the store
  const updateTranscription = useCallback((text) => {
    // Accumulate transcription text
    transcriptionBufferRef.current += text + ' '

    // Update the dictation store
    if (window.useDictationStore) {
      window.useDictationStore.getState().updateTranscription(transcriptionBufferRef.current.trim())
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)

      // Reset transcription buffer
      transcriptionBufferRef.current = ''

      // Initialize timestamp tracking
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

      console.log('Microphone stream obtained:', {
        tracks: stream.getTracks().length,
        audioTracks: stream.getAudioTracks().length,
        settings: stream.getAudioTracks()[0]?.getSettings(),
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

      // For real-time processing, we'll use a different approach
      // Set up ScriptProcessorNode for raw audio data
      const bufferSize = 4096
      const processor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1)
      let audioBuffer = []
      let lastProcessTime = Date.now()
      let consecutiveSilenceChunks = 0
      const maxSilenceChunks = 3 // Allow up to 3 consecutive silent chunks

      processor.onaudioprocess = async (event) => {
        const inputBuffer = event.inputBuffer
        const inputData = inputBuffer.getChannelData(0)

        // Collect audio data
        audioBuffer.push(...inputData)

        // Process every 3 seconds of audio (48000 samples at 16kHz) - longer chunks for better context
        if (audioBuffer.length >= 48000) {
          const now = Date.now()
          if (now - lastProcessTime >= 2000) {
            // Minimum 2 second interval
            lastProcessTime = now

            // Check if this chunk contains speech
            const currentChunk = audioBuffer.slice(-48000)
            const hasSpeechInChunk = hasSpeech(currentChunk)

            if (hasSpeechInChunk) {
              consecutiveSilenceChunks = 0 // Reset silence counter
            } else {
              consecutiveSilenceChunks++
            }

            // Only process if we have speech or haven't had too many silent chunks
            if (hasSpeechInChunk || consecutiveSilenceChunks <= maxSilenceChunks) {
              try {
                // Check if AI service is initialized first
                if (window.electronAPI) {
                  const status = await window.electronAPI.aiGetStatus()
                  if (!status.initialized) {
                    console.log('AI service not initialized, attempting to initialize...')
                    const initResult = await window.electronAPI.aiInitialize()
                    if (!initResult.success) {
                      throw new Error('Failed to initialize AI service: ' + initResult.error)
                    }
                  }

                  setIsProcessing(true)

                  // Use the full 3-second chunk for better context
                  const wavBuffer = createWavBuffer(currentChunk, 16000)
                  const uint8Array = new Uint8Array(wavBuffer)
                  const hexString = Array.from(uint8Array)
                    .map((byte) => byte.toString(16).padStart(2, '0'))
                    .join('')

                  console.log(
                    `Processing audio segment: ${wavBuffer.byteLength} bytes WAV, hex length: ${hexString.length}, hasSpeech: ${hasSpeechInChunk}`
                  )

                  const result = await window.electronAPI.processAudioChunk(hexString, 16000)

                  console.log('Whisper.cpp result:', result)

                  if (result && result.success && result.result && result.result.text) {
                    // Only update transcription if we got meaningful text (not just blank audio)
                    const text = result.result.text.trim()
                    if (text && text !== '[BLANK_AUDIO]' && text.length > 0) {
                      console.log('Raw Whisper.cpp text:', result.result.text)
                      console.log('Raw Whisper.cpp segments:', result.result.segments)

                      // Update transcription in the store (no refinement during recording)
                      updateTranscription(result.result.text)

                      console.log('Real-time transcription updated:', result.result.text)
                    } else {
                      console.log('Skipping blank or empty transcription result')
                    }
                  }

                  // Update total processed time based on actual audio chunk duration
                  // Each chunk is 3 seconds (48000 samples at 16kHz)
                  totalProcessedTimeRef.current += 3
                }
              } catch (err) {
                console.error('Error processing audio chunk:', err)
                setError(`Audio processing error: ${err.message}`)
              } finally {
                setIsProcessing(false)
              }
            } else {
              console.log('Skipping processing due to consecutive silence chunks:', consecutiveSilenceChunks)
            }
          }

          // Keep only the last 3 seconds of audio data for context
          audioBuffer = audioBuffer.slice(-48000)
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

      // Handle recording stop
      mediaRecorder.onstop = () => {
        setIsRecording(false)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (processor) {
          processor.disconnect()
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
  }, [updateAudioLevel, updateTranscription, hasSpeech])

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
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()

      // Clean up streams and contexts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Reset timestamp tracking
      recordingStartTimeRef.current = null
      totalProcessedTimeRef.current = 0

      setAudioLevel(0)
    }
  }, [isRecording])

  // Save complete recording
  const saveRecording = useCallback(async (meetingId) => {
    if (chunksRef.current.length === 0) {
      throw new Error('No audio data to save')
    }

    try {
      console.log(`Recording completed for meeting ${meetingId}`)
      console.log(`Number of audio chunks: ${chunksRef.current.length}`)

      // Final AI refinement of complete transcription
      try {
        if (window.electronAPI && window.electronAPI.llamaGetStatus) {
          const llamaStatus = await window.electronAPI.llamaGetStatus()
          if (llamaStatus.success && llamaStatus.initialized) {
            const currentTranscription = transcriptionBufferRef.current.trim()
            if (currentTranscription) {
              console.log('Performing final AI refinement of complete transcription...')
              const finalRefinePrompt = `
                  You are a writing assistant. 
                  Clean up the following voice transcription by correcting grammar, 
                  punctuation, and formatting. Preserve the speaker’s intent and tone. 
                  Return ONLY the revised text—no explanations, no headings, and no comments.
                   The output should be ready to copy into an email, website inputs, document, or message:
                  "${currentTranscription}"`
              const finalRefinedResult = await window.electronAPI.llamaAnswerQuestion(
                finalRefinePrompt,
                meetingId,
                [],
                []
              )
              if (finalRefinedResult.success && finalRefinedResult.answer) {
                console.log('Final Llama.cpp refinement result:', finalRefinedResult.answer)
                // Replace the transcription with refined version
                if (window.useDictationStore) {
                  window.useDictationStore.getState().updateTranscription(finalRefinedResult.answer)
                  window.useDictationStore.getState().setProcessedTranscription('')
                }
              }
            }
          }
        }
      } catch (finalRefineError) {
        console.warn('Final AI refinement failed:', finalRefineError.message)
      }

      // Clear chunks since transcription was saved live
      chunksRef.current = []

      // Return success since transcription was already saved during recording
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
