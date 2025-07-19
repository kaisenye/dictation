import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Save, AlertTriangle, Mic, MicOff, Bot, FileText } from 'lucide-react';
import useAudioRecording from '../../hooks/useAudioRecording';
import LiveTranscription from '../transcription/LiveTranscription';
import AIChatInterface from '../ai/AIChatInterface';
import { useMeetingStore } from '../../stores/meetingStore';
import { formatDetailedDuration } from '../../utils/dateFormatter';
import Button from '../ui/Button';

const LiveMeetingView = ({ meeting, onSaveMeeting, onEndMeeting }) => {
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [currentTranscripts, setCurrentTranscripts] = useState([]);
  const [currentSpeakers, setCurrentSpeakers] = useState([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const { updateMeeting } = useMeetingStore();
  
  const {
    isRecording,
    isProcessing,
    error: recordingError,
    audioLevel,
    startRecording,
    stopRecording,
    saveRecording,
  } = useAudioRecording();

  // Update meeting duration
  useEffect(() => {
    if (!meeting?.start_time) return;
    
    const startTime = new Date(meeting.start_time);
    const interval = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now - startTime) / 1000);
      setMeetingDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [meeting?.start_time]);

  // Track unsaved changes when recording starts/stops
  useEffect(() => {
    if (isRecording) {
      setHasUnsavedChanges(true);
    }
  }, [isRecording]);

  // Load current transcripts for AI chat
  useEffect(() => {
    const loadCurrentTranscripts = async () => {
      if (!meeting?.id) return;
      
      try {
        const transcriptData = await window.electronAPI.getTranscripts(meeting.id);
        const speakerData = await window.electronAPI.getSpeakers(meeting.id);
        
        setCurrentTranscripts(transcriptData || []);
        setCurrentSpeakers(speakerData || []);
      } catch (error) {
        console.error('Error loading current transcripts:', error);
      }
    };

    // Load transcripts periodically during meeting
    loadCurrentTranscripts();
    const interval = setInterval(loadCurrentTranscripts, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [meeting?.id]);

  // Generate meeting summary
  const generateMeetingSummary = async () => {
    if (!currentTranscripts.length) {
      console.log('No transcripts available for summary');
      return;
    }

    setIsGeneratingSummary(true);
    
    try {
      // Ensure Llama.cpp service is initialized
      const status = await window.electronAPI.llamaGetStatus();
      if (!status.initialized) {
        console.log('Initializing Llama.cpp service for summary generation...');
        const initResult = await window.electronAPI.llamaInitialize();
        if (!initResult.success) {
          throw new Error(`Failed to initialize Llama.cpp service: ${initResult.error}`);
        }
      }

      const result = await window.electronAPI.llamaGenerateSummary(
        meeting.id,
        currentTranscripts,
        currentSpeakers
      );

      if (result.success) {
        // Update meeting with summary
        await updateMeeting(meeting.id, { 
          summary: result.summary,
          summary_generated_at: new Date().toISOString()
        });
        
        console.log('Meeting summary generated and saved');
      } else {
        console.error('Failed to generate summary:', result.error);
      }
    } catch (error) {
      console.error('Error generating meeting summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      // Set global meeting ID for live transcription
      window.currentMeetingId = meeting.id;
      
      await startRecording();
      console.log('Recording started for meeting:', meeting.id);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      await stopRecording();
      console.log('Recording stopped for meeting:', meeting.id);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Handle save meeting
  const handleSaveMeeting = async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Save the recording and get transcription results
      const transcriptionResult = await saveRecording(meeting.id);
      
      // Update meeting with final details
      const updatedMeeting = {
        ...meeting,
        status: 'completed',
        end_time: new Date().toISOString(),
        duration: meetingDuration,
        transcription_status: 'completed',
        has_transcription: true
      };
      
      await updateMeeting(meeting.id, updatedMeeting);
      
      if (onSaveMeeting) {
        onSaveMeeting(updatedMeeting, transcriptionResult);
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving meeting:', error);
      setSaveError('Failed to save meeting: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle end meeting
  const handleEndMeeting = async () => {
    if (isRecording) {
      await handleStopRecording();
    }
    
    if (hasUnsavedChanges) {
      await handleSaveMeeting();
    }
    
    // Auto-generate meeting summary
    if (currentTranscripts.length > 0) {
      await generateMeetingSummary();
    }
    
    if (onEndMeeting) {
      onEndMeeting(meeting);
    }
  };

  // Get meeting status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'recording': return 'text-red-600 bg-red-50';
      case 'processing': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!meeting) {
    return (
      <div data-testid="no-meeting-selected" className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <p>No meeting selected</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="live-meeting-view" className="max-w-6xl mx-auto space-y-6">
      {/* Meeting Header */}
      <div data-testid="meeting-header" className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 data-testid="meeting-title" className="text-lg font-bold text-gray-900 mb-2">
              {meeting.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span data-testid="meeting-start-time">{new Date(meeting.start_time).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span data-testid="meeting-duration">{formatDetailedDuration(meetingDuration)}</span>
              </div>
              {meeting.platform && (
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span data-testid="meeting-platform">{meeting.platform}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span data-testid="meeting-status" className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(isRecording ? 'recording' : 'completed')}`}>
              {isRecording ? 'Recording' : 'Ready'}
            </span>
            
            {hasUnsavedChanges && (
              <span data-testid="unsaved-changes-indicator" className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Unsaved
              </span>
            )}
          </div>
        </div>

        {/* Recording Controls */}
        <div data-testid="recording-controls" className="flex items-center space-x-4">
          {!isRecording ? (
            <Button
              data-testid="start-recording-btn"
              variant="primary"
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="flex items-center space-x-2"
            >
              <Mic className="w-4 h-4" />
              <span>Start Recording</span>
            </Button>
          ) : (
            <Button
              data-testid="stop-recording-btn"
              variant="outline"
              onClick={handleStopRecording}
              disabled={isProcessing}
              className="flex items-center space-x-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <MicOff className="w-4 h-4" />
              <span>Stop Recording</span>
            </Button>
          )}
          
          <Button
            data-testid="ai-chat-btn"
            variant="outline"
            onClick={() => setShowAIChat(!showAIChat)}
            className="flex items-center space-x-2"
          >
            <Bot className="w-4 h-4" />
            <span>AI Chat</span>
          </Button>
          
          {currentTranscripts.length > 0 && (
            <Button
              data-testid="generate-summary-btn"
              variant="outline"
              onClick={generateMeetingSummary}
              disabled={isGeneratingSummary}
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>{isGeneratingSummary ? 'Generating...' : 'Generate Summary'}</span>
            </Button>
          )}
          
          {hasUnsavedChanges && (
            <Button
              data-testid="save-meeting-btn"
              variant="outline"
              onClick={handleSaveMeeting}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Meeting'}</span>
            </Button>
          )}
          
          <Button
            data-testid="end-meeting-btn"
            variant="outline"
            onClick={handleEndMeeting}
            className="flex items-center space-x-2"
          >
            <span>End Meeting</span>
          </Button>
        </div>

        {/* Error Display */}
        {(recordingError || saveError) && (
          <div data-testid="error-display" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span>{recordingError || saveError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Transcription */}
      <LiveTranscription
        isRecording={isRecording}
        isProcessing={isProcessing}
        audioLevel={audioLevel}
        error={recordingError}
      />

      {/* AI Chat Interface */}
      {showAIChat && (
        <AIChatInterface
          meetingId={meeting.id}
          transcripts={currentTranscripts}
          speakers={currentSpeakers}
          isVisible={showAIChat}
          onClose={() => setShowAIChat(false)}
        />
      )}
    </div>
  );
};

export default LiveMeetingView; 