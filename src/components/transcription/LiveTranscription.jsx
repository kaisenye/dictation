import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Users, Clock, AlertCircle } from 'lucide-react';
import { formatDetailedDuration } from '../../utils/dateFormatter';

const LiveTranscription = ({ isRecording, isProcessing, audioLevel, error }) => {
  const [transcripts, setTranscripts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState({
    totalTime: 0,
    segments: 0,
    words: 0
  });
  
  const transcriptContainerRef = useRef(null);

  // Listen for real-time transcription events
  useEffect(() => {
    const handleTranscription = (event) => {
      const { text, segments, language } = event.detail;
      
      console.log('Received transcription event:', { text, segments, language });
      
      if (segments && segments.length > 0) {
        // Debug each segment
        segments.forEach((segment, index) => {
          console.log(`Segment ${index}:`, {
            text: segment.text,
            textLength: segment.text?.length,
            start: segment.start,
            end: segment.end,
            speaker: segment.speaker
          });
        });
        
        setTranscripts(prev => [...prev, ...segments]);
        
        // Update stats
        setStats(prev => {
          const newTotalTime = prev.totalTime + segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
          const newSegments = prev.segments + segments.length;
          const newWords = prev.words + segments.reduce((sum, seg) => sum + seg.text.split(' ').length, 0);
          
          return {
            totalTime: newTotalTime,
            segments: newSegments,
            words: newWords
          };
        });
      }
    };

    window.addEventListener('realtimeTranscription', handleTranscription);
    return () => window.removeEventListener('realtimeTranscription', handleTranscription);
  }, []);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (transcriptContainerRef.current && isExpanded) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcripts, isExpanded]);

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div data-testid="live-transcription" className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div data-testid="transcription-header" className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isRecording ? (
              <div data-testid="recording-indicator" className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-600">Recording</span>
              </div>
            ) : (
              <div data-testid="not-recording-indicator" className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Not Recording</span>
              </div>
            )}
          </div>
          
          {isProcessing && (
            <div data-testid="processing-indicator" className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Processing...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Audio Level Indicator */}
          <div data-testid="audio-level-indicator" className="flex items-center space-x-2">
            {isRecording ? (
              <Volume2 className="w-4 h-4 text-green-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                data-testid="audio-level-bar"
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${audioLevel * 1000}%` }}
              ></div>
            </div>
          </div>
          
          {/* Expand/Collapse Button */}
          <button
            data-testid="toggle-transcription-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Hide' : 'Show'} Transcription
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div data-testid="transcription-error" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      {transcripts.length > 0 && (
        <div data-testid="transcription-stats" className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span data-testid="speaker-count">{new Set(transcripts.map(t => t.speaker)).size} speakers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span data-testid="total-time">{formatDetailedDuration(stats.totalTime)}</span>
                <span>({stats.segments} segments)</span>
              </div>
            </div>
            <div className="text-xs">
              {stats.words} words transcribed
            </div>
          </div>
        </div>
      )}

      {/* Transcription Content */}
      {isExpanded && (
        <div data-testid="transcription-content" className="border-t pt-4">
          {transcripts.length === 0 ? (
            <div data-testid="no-transcripts" className="text-center py-8 text-gray-500">
              <Mic className="w-8 h-8 mx-auto mb-2" />
              <p>No transcription yet. Start speaking to see real-time transcription.</p>
            </div>
          ) : (
            <div 
              data-testid="transcript-container"
              ref={transcriptContainerRef}
              className="max-h-64 overflow-y-auto space-y-2"
            >
              {transcripts.map((transcript, index) => (
                <div 
                  key={index} 
                  data-testid={`live-transcript-${index}`}
                  className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50"
                >
                  {/* Speaker */}
                  <div className="flex-shrink-0">
                    <span data-testid="live-speaker" className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {transcript.speaker || 'Unknown'}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p data-testid="live-transcript-text" className="text-sm text-gray-900">
                      {transcript.text}
                    </p>
                    
                    {/* Timestamp and Confidence */}
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDetailedDuration(transcript.start)} - {formatDetailedDuration(transcript.end)}
                        </span>
                        {transcript.timestamp && (
                          <span>({new Date(transcript.timestamp).toLocaleTimeString()})</span>
                        )}
                      </div>
                      
                      {transcript.confidence && (
                        <span 
                          data-testid="live-confidence"
                          className={`text-xs font-medium ${getConfidenceColor(transcript.confidence)}`}
                        >
                          {Math.round(transcript.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveTranscription; 