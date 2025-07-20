import React from 'react'
import { Mic, MicOff, Square } from 'lucide-react'

const DictationControls = ({ isRecording, onStart, onStop }) => {
  return (
    <div className="flex items-center space-x-3">
      {!isRecording ? (
        <button
          onClick={onStart}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors border border-gray-600 text-sm"
        >
          <Mic className="w-4 h-4" />
          <span className="font-medium">Start</span>
        </button>
      ) : (
        <button
          onClick={onStop}
          className="flex items-center space-x-2 px-3 py-1.5 bg-red-800 text-red-200 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors border border-red-600 text-sm"
        >
          <Square className="w-4 h-4" />
          <span className="font-medium">Stop</span>
        </button>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300">Recording...</span>
        </div>
      )}
    </div>
  )
}

export default DictationControls
