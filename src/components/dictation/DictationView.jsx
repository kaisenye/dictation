import React, { useEffect, useState } from 'react'
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

  // Handle global shortcuts
  useEffect(() => {
    if (window.electronAPI) {
      const handleStopDictation = () => {
        if (isRecording) {
          handleStopRecording()
        }
      }

      const handleCopyTranscription = () => {
        copyToClipboard()
      }

      window.electronAPI.onGlobalShortcutStopDictation(handleStopDictation)
      window.electronAPI.onGlobalShortcutCopyTranscription(handleCopyTranscription)

      return () => {
        // Cleanup listeners if needed
      }
    }
  }, [isRecording])

  const copyToClipboard = async () => {
    const textToCopy = getTranscriptionToCopy()
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
        console.log('Transcription copied to clipboard')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  const handleStartRecording = async () => {
    try {
      await startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
      useDictationStore.getState().setError('Failed to access microphone')
    }
  }

  const handleStopRecording = async () => {
    try {
      await stopRecording()
      // Save the recording (this will trigger final processing)
      await saveRecording('dictation-session')
    } catch (error) {
      console.error('Failed to stop recording:', error)
      useDictationStore.getState().setError('Failed to stop recording')
    }
  }

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
        className="h-8 bg-gray-800 cursor-move hover:bg-gray-700 transition-colors"
        style={{ WebkitAppRegion: 'drag' }}
        title="Drag to move window"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Transcription Display */}
        <div className="flex-1 bg-gray-800 rounded-lg border border-gray-600 mb-4">
          <TranscriptionDisplay
            transcription={transcription}
            processedTranscription={processedTranscription}
            isRecording={isRecording}
            isProcessing={isProcessing}
            audioLevel={audioLevel}
          />
        </div>

        {/* Controls and Stats */}
        <div className="flex items-center justify-between">
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
        <div className="bg-red-900 border-t border-red-700 px-4 py-3">
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
