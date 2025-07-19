import React from 'react'
import { Loader2 } from 'lucide-react'

const TranscriptionDisplay = ({ transcription, processedTranscription, isRecording, isProcessing, audioLevel = 0 }) => {
  const displayText = processedTranscription || transcription
  const isLive = isRecording && !processedTranscription

  return (
    <div className="w-full h-full flex flex-col">
      {/* Text Display */}
      <div className="flex-1 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 overflow-y-auto border border-gray-600/30">
        {displayText ? (
          <div className="space-y-3">
            {/* Raw transcription (if different from processed) */}
            {processedTranscription && transcription && transcription !== processedTranscription && (
              <div className="border-b border-gray-600/50 pb-3">
                <h4 className="text-xs font-medium text-gray-400 mb-2">Original</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{transcription}</p>
              </div>
            )}

            {/* Main display text */}
            <div>
              {processedTranscription && <h4 className="text-xs font-medium text-gray-400 mb-2">Processed</h4>}
              <p className={`leading-relaxed ${isLive ? 'text-gray-200' : 'text-gray-100'}`}>{displayText}</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">
                {isRecording ? 'Start speaking...' : 'Click the microphone to start dictating'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TranscriptionDisplay
