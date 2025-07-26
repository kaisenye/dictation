import React, { useEffect, useCallback, useRef } from 'react'
import useDictationStore from '../../stores/dictationStore'
import useAudioRecording from '../../hooks/useAudioRecording'
import SoundWaveVisualizer from './SoundWaveVisualizer'

const DictationView = () => {
  console.log('=== DictationView component rendered ===')

  const { error, clearError } = useDictationStore()

  // Use the proper audio recording hook
  console.log('=== Calling useAudioRecording hook ===')
  const {
    isRecording,
    isProcessing,
    error: recordingError,
    audioLevel,
    startRecording,
    stopRecording,
    saveRecording,
  } = useAudioRecording()

  console.log('=== useAudioRecording returned ===', { isRecording, isProcessing, audioLevel, recordingError })

  // Log errors
  if (error) console.log('Store error:', error)
  if (recordingError) console.log('Recording error:', recordingError)

  // Ref to track if we're currently handling a toggle to prevent double-triggers
  const isHandlingToggleRef = useRef(false)

  // Ref to track the latest recording state to prevent stale closures
  const recordingStateRef = useRef(isRecording)

  // Update the ref whenever isRecording changes
  useEffect(() => {
    recordingStateRef.current = isRecording
  }, [isRecording])

  // Stable callback functions using useCallback
  const handleStartRecording = useCallback(async () => {
    console.log('=== handleStartRecording called ===')
    try {
      console.log('Calling startRecording...')
      await startRecording()
      console.log('startRecording completed successfully')
    } catch (error) {
      console.error('Failed to start recording:', error)
      useDictationStore.getState().setError('Failed to access microphone')
    }
  }, [startRecording])

  const handleStopRecording = useCallback(async () => {
    console.log('=== handleStopRecording called ===')
    try {
      console.log('Calling stopRecording...')
      await stopRecording()

      console.log('Calling saveRecording...')
      // Save the recording (this will trigger final processing)
      await saveRecording('dictation-session')
      console.log('saveRecording completed successfully')
    } catch (error) {
      console.error('Failed to stop recording:', error)
      useDictationStore.getState().setError(`Failed to stop recording: ${error.message}`)
    }
  }, [stopRecording, saveRecording])

  // Main toggle handler with debouncing
  const handleToggleDictation = useCallback(async () => {
    console.log('=== handleToggleDictation called ===')
    console.log('Currently recording:', recordingStateRef.current)
    console.log('Is handling toggle:', isHandlingToggleRef.current)

    // Prevent multiple rapid triggers
    if (isHandlingToggleRef.current) {
      console.log('Already handling toggle, skipping...')
      return
    }

    isHandlingToggleRef.current = true

    try {
      // Use the ref to get the current state instead of the stale closure
      const currentlyRecording = recordingStateRef.current

      if (currentlyRecording) {
        console.log('Stopping recording...')
        await handleStopRecording()
        // Add a small delay after stopping to ensure cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 100))
      } else {
        console.log('Starting recording...')
        await handleStartRecording()
      }
    } catch (error) {
      console.error('Error in toggle dictation:', error)
    } finally {
      // Reset the flag after a short delay to prevent rapid re-triggers
      setTimeout(() => {
        isHandlingToggleRef.current = false
        console.log('Toggle handler reset')
      }, 500)
    }
  }, [handleStartRecording, handleStopRecording]) // Remove isRecording from dependencies

  // Check AI services status on mount
  useEffect(() => {
    const checkServices = async () => {
      if (window.electronAPI) {
        try {
          const whisperStatus = await window.electronAPI.aiGetStatus()
          console.log('Whisper service status:', whisperStatus)

          const llamaStatus = await window.electronAPI.llamaGetStatus()
          console.log('Llama service status:', llamaStatus)
        } catch (error) {
          console.error('Error checking service status:', error)
        }
      }
    }

    checkServices()
  }, [])

  // Set up global shortcuts once on mount
  useEffect(() => {
    console.log('=== Setting up event listeners ===')
    if (!window.electronAPI) {
      console.warn('electronAPI not available')
      return
    }

    console.log('electronAPI is available, setting up toggle dictation listener')
    // Set up event listeners
    window.electronAPI.onGlobalShortcutToggleDictation(() => {
      console.log('=== Received global-shortcut-toggle-dictation event in React ===')
      console.log('Current recording state:', recordingStateRef.current)
      console.log('Is handling toggle:', isHandlingToggleRef.current)
      handleToggleDictation()
    })

    console.log('Event listeners set up successfully')

    // Cleanup function
    return () => {
      // Note: In a real implementation, you might want to remove listeners
      // but the current electronAPI doesn't expose removeListener methods
    }
  }, [handleToggleDictation]) // Include the callbacks as dependencies

  // Update store with recording state
  useEffect(() => {
    useDictationStore.getState().setRecordingState(isRecording, isProcessing)
  }, [isRecording, isProcessing])

  // Handle recording errors
  useEffect(() => {
    if (recordingError) {
      useDictationStore.getState().setError(recordingError)
    }
  }, [recordingError])

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/90 rounded-xl border border-gray-800 shadow-2xl backdrop-blur-sm">
      {/* Draggable area */}
      <div className="absolute inset-0 cursor-move rounded-xl" style={{ WebkitAppRegion: 'drag' }} />

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center w-full h-full px-6">
        <SoundWaveVisualizer audioLevel={audioLevel} isRecording={isRecording} className="flex-1" />

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-medium">REC</span>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute bottom-3 left-3 flex items-center space-x-1">
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            <span className="text-blue-400 text-xs ml-1">Processing...</span>
          </div>
        )}
      </div>

      {/* Error Display - minimal */}
      {(error || recordingError) && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-red-900/95 text-red-200 text-xs px-3 py-1.5 rounded-lg border border-red-700/50 max-w-xs truncate">
            <span>{error || recordingError}</span>
            <button onClick={clearError} className="ml-2 text-red-300 hover:text-red-100 text-xs font-bold">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DictationView
