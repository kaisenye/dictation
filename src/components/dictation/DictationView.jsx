import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Mic, MicOff, Copy, Settings, X, Check } from 'lucide-react'
import useDictationStore from '../../stores/dictationStore'
import useAudioRecording from '../../hooks/useAudioRecording'
import TranscriptionDisplay from './TranscriptionDisplay'
import DictationControls from './DictationControls'

const DictationView = () => {
  const {
    transcription,
    processedTranscription,
    useCase,
    wordCount,
    getFormattedDuration,
    getTranscriptionToCopy,
    error,
    clearError,
    setUseCase,
    reset,
  } = useDictationStore()

  // Use the proper audio recording hook
  const {
    isRecording,
    isProcessing,
    error: recordingError,
    audioLevel,
    startRecording,
    stopRecording,
    saveRecording,
  } = useAudioRecording()

  // Copy button state
  const [copied, setCopied] = useState(false)

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
    try {
      await startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
      useDictationStore.getState().setError('Failed to access microphone')
    }
  }, [startRecording])

  const handleStopRecording = useCallback(async () => {
    try {
      await stopRecording()

      // Save the recording (this will trigger final processing)
      await saveRecording('dictation-session')
    } catch (error) {
      console.error('Failed to stop recording:', error)
      useDictationStore.getState().setError(`Failed to stop recording: ${error.message}`)
    }
  }, [stopRecording, saveRecording])

  const copyToClipboard = useCallback(async () => {
    const textToCopy = getTranscriptionToCopy()
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }, [getTranscriptionToCopy])

  // Main toggle handler with debouncing
  const handleToggleDictation = useCallback(async () => {
    // Prevent multiple rapid triggers
    if (isHandlingToggleRef.current) {
      return
    }

    isHandlingToggleRef.current = true

    try {
      // Use the ref to get the current state instead of the stale closure
      const currentlyRecording = recordingStateRef.current

      if (currentlyRecording) {
        await handleStopRecording()
        // Add a small delay after stopping to ensure cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 100))
      } else {
        await handleStartRecording()
      }
    } catch (error) {
      console.error('Error in toggle dictation:', error)
    } finally {
      // Reset the flag after a short delay to prevent rapid re-triggers
      setTimeout(() => {
        isHandlingToggleRef.current = false
      }, 500)
    }
  }, [handleStartRecording, handleStopRecording]) // Remove isRecording from dependencies

  // Set up global shortcuts once on mount
  useEffect(() => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available')
      return
    }

    // Set up event listeners
    window.electronAPI.onGlobalShortcutToggleDictation((...args) => {
      handleToggleDictation()
    })

    window.electronAPI.onGlobalShortcutCopyTranscription((...args) => {
      copyToClipboard()
    })

    // Cleanup function
    return () => {
      // Note: In a real implementation, you might want to remove listeners
      // but the current electronAPI doesn't expose removeListener methods
    }
  }, [handleToggleDictation, copyToClipboard]) // Include the callbacks as dependencies

  const handleClose = () => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow()
    }
  }

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
    <div className="h-screen flex flex-col bg-gray-800">
      {/* Header - Simplified draggable area */}
      <div
        className="h-8 bg-gray-800 cursor-move hover:bg-gray-700 transition-colors flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' }}
        title="Drag to move window"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {/* Transcription Display */}
        <div className="flex-1 min-h-0 bg-gray-800 rounded-lg border border-gray-600 mb-4">
          <TranscriptionDisplay
            transcription={transcription}
            processedTranscription={processedTranscription}
            isRecording={isRecording}
            isProcessing={isProcessing}
            audioLevel={audioLevel}
          />
        </div>

        {/* Controls and Stats */}
        <div className="flex items-center justify-between flex-shrink-0">
          <DictationControls isRecording={isRecording} onStart={handleStartRecording} onStop={handleStopRecording} />

          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span>{wordCount} words</span>
            <span>{getFormattedDuration()}</span>
            <button
              onClick={copyToClipboard}
              disabled={!transcription && !processedTranscription}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors border border-gray-600"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border-t border-red-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-red-200 text-sm">{error}</span>
            <button onClick={clearError} className="text-red-300 hover:text-red-100 transition-colors">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DictationView
