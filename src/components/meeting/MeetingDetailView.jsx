import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, FileText, Search, Download, Edit2, ArrowLeft, MessageSquare, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { useMeetingStore } from '../../stores/meetingStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import AIChatInterface from '../ai/AIChatInterface';
import { formatDetailedDuration, formatTranscriptTime } from '../../utils/dateFormatter';

const MeetingDetailView = ({ meeting, onBack }) => {
  const [transcripts, setTranscripts] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTranscripts, setFilteredTranscripts] = useState([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const { updateMeeting } = useMeetingStore();

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId;
      return (notes) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (notes !== currentNotes) {
            setIsSaving(true);
            try {
              await updateMeeting(meeting.id, { notes });
              setCurrentNotes(notes);
            } catch (error) {
              console.error('Error auto-saving notes:', error);
            } finally {
              setIsSaving(false);
            }
          }
        }, 1000); // 1 second debounce
      };
    })(),
    [currentNotes, meeting?.id, updateMeeting]
  );

  // Load meeting transcripts and speakers
  useEffect(() => {
    const loadMeetingData = async () => {
      if (!meeting?.id) return;
      
      setIsLoading(true);
      try {
        // Load transcripts
        const transcriptData = await window.electronAPI.getTranscripts(meeting.id);
        setTranscripts(transcriptData || []);
        
        // Load speakers
        const speakerData = await window.electronAPI.getSpeakers(meeting.id);
        setSpeakers(speakerData || []);
        
        const notes = meeting.notes || '';
        setCurrentNotes(notes);
        setInputNotes(notes);
      } catch (error) {
        console.error('Error loading meeting data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetingData();
  }, [meeting?.id, meeting?.notes]);

  // Filter transcripts based on search and speaker selection
  useEffect(() => {
    let filtered = transcripts;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(transcript =>
        transcript.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by selected speaker
    if (selectedSpeaker !== 'all') {
      filtered = filtered.filter(transcript => transcript.speaker_id === selectedSpeaker);
    }

    setFilteredTranscripts(filtered);
  }, [transcripts, searchQuery, selectedSpeaker]);

  // Get speaker color
  const getSpeakerColor = (speakerId) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    
    if (!speakerId) return 'bg-gray-100 text-gray-800';
    
    const index = parseInt(speakerId.replace('speaker_', '')) || 0;
    return colors[index % colors.length];
  };

  // Export transcription
  const handleExport = () => {
    const exportData = {
      meeting: {
        title: meeting.title,
        date: new Date(meeting.start_time).toLocaleDateString(),
        duration: formatDetailedDuration(meeting.duration || 0),
        platform: meeting.platform
      },
      transcripts: transcripts.map(t => ({
        timestamp: formatTranscriptTime(t.start_time),
        speaker: speakers.find(s => s.id === t.speaker_id)?.display_name || t.speaker_id || 'Unknown',
        text: t.text
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle notes change with auto-save
  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setInputNotes(newNotes);
    debouncedSave(newNotes);
  };

  // Get unique speakers for filter
  const uniqueSpeakers = [...new Set(transcripts.map(t => t.speaker_id))].filter(Boolean);

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3" />
          <p>Meeting not found</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="meeting-detail-view" className="w-full mx-auto flex flex-col gap-2">
      {/* Sticky Header */}
      <div data-testid="meeting-detail-header" className="sticky top-12 z-30 bg-white rounded-lg border border-gray-200">
        {/* Compact Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 data-testid="meeting-detail-title" className="text-lg font-bold text-gray-900 mb-1">
                  {meeting.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span data-testid="meeting-detail-date">{new Date(meeting.start_time).toLocaleDateString()}</span>
                  </div>
                  {meeting.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span data-testid="meeting-detail-duration">{formatDetailedDuration(meeting.duration)}</span>
                    </div>
                  )}
                  {meeting.platform && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span data-testid="meeting-detail-platform">{meeting.platform}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                data-testid="ai-chat-btn"
                variant="outline"
                size="sm"
                onClick={() => setShowAIChat(!showAIChat)}
                className="flex items-center space-x-2"
              >
                <Bot className="w-4 h-4" />
                <span>AI Chat</span>
              </Button>
              <Button
                data-testid="export-transcript-btn"
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          {/* Expandable Notes Section */}
          <div className="mt-3 border-t pt-3">
            <button
              data-testid="toggle-notes-btn"
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors mb-2"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Notes</span>
                {inputNotes && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {inputNotes.length} characters
                  </span>
                )}
                {isSaving && (
                  <span className="text-xs text-blue-500 flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
                    <span>Saving...</span>
                  </span>
                )}
              </div>
              {isNotesExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {/* Expanded Notes Content */}
            {isNotesExpanded && (
              <div data-testid="meeting-notes-section" className="rounded-lg">
                {/* Meeting Description */}
                {meeting.description && (
                  <div data-testid="meeting-description" className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 text-sm">{meeting.description}</p>
                  </div>
                )}

                {/* Direct Notes Editor */}
                <div data-testid="notes-editor" className="space-y-2">
                  {isSaving && (
                    <div className="flex items-center justify-end">
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500"></div>
                        <span>Auto-saving...</span>
                      </span>
                    </div>
                  )}
                  <textarea
                    data-testid="notes-textarea"
                    value={inputNotes}
                    onChange={handleNotesChange}
                    placeholder="Add notes about this meeting ..."
                    className="w-full h-32 px-6 py-4 rounded-lg resize-none text-md transition-colors bg-gray-50 focus:outline-none focus:ring-0 border-0 focus:border-0 focus:shadow-none"
                    style={{ border: 'none', outline: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-4">
        {/* Summary Section */}
        {meeting.summary && (
          <div data-testid="summary-section" className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 data-testid="summary-title" className="text-base font-semibold text-gray-900">
                AI Summary
              </h2>
              {meeting.summary_generated_at && (
                <span data-testid="summary-timestamp" className="text-xs text-gray-500">
                  Generated {new Date(meeting.summary_generated_at).toLocaleString()}
                </span>
              )}
            </div>
            <div data-testid="summary-content" className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{meeting.summary}</p>
            </div>
          </div>
        )}

        {/* Transcription Section */}
        <div data-testid="transcription-section" className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 data-testid="transcription-title" className="text-base font-semibold text-gray-900">
              Transcription
            </h2>
            
            {/* Filters */}
            <div data-testid="transcription-filters" className="flex items-center space-x-3">
              {/* Speaker Filter */}
              {uniqueSpeakers.length > 1 && (
                <select
                  data-testid="speaker-filter"
                  value={selectedSpeaker}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Speakers</option>
                  {uniqueSpeakers.map(speakerId => (
                    <option key={speakerId} value={speakerId}>
                      {speakers.find(s => s.id === speakerId)?.display_name || speakerId || 'Unknown'}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  data-testid="transcription-search"
                  placeholder="Search transcription..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {/* Transcripts */}
          {isLoading ? (
            <div data-testid="transcription-loading" className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2 text-gray-600">Loading transcription...</span>
            </div>
          ) : filteredTranscripts.length === 0 ? (
            <div data-testid="no-transcription" className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 data-testid="no-transcription-title" className="text-md font-medium text-gray-900 mb-2">
                {searchQuery ? 'No matching transcripts found' : 'No transcription available'}
              </h3>
              <p data-testid="no-transcription-description" className="text-xs text-gray-600">
                {searchQuery ? 'Try adjusting your search terms.' : 'This meeting does not have any transcription data.'}
              </p>
            </div>
          ) : (
            <div data-testid="transcript-list" className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTranscripts.map((transcript, index) => (
                <div key={transcript.id} data-testid={`transcript-segment-${index}`} className="flex space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Timestamp */}
                  <div data-testid="transcript-timestamp" className="flex-shrink-0 text-xs text-gray-500 w-16">
                    {formatTranscriptTime(transcript.start_time)}
                  </div>
                  
                  {/* Speaker Badge */}
                  <div className="flex-shrink-0">
                    <span data-testid="transcript-speaker" className={`px-2 py-1 rounded text-xs font-medium ${getSpeakerColor(transcript.speaker_id)}`}>
                      {speakers.find(s => s.id === transcript.speaker_id)?.display_name || transcript.speaker_id || 'Unknown'}
                    </span>
                  </div>
                  
                  {/* Transcript Text */}
                  <div className="flex-1">
                    <p data-testid="transcript-text" className="text-sm text-gray-800">
                      {transcript.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Interface */}
      {showAIChat && (
        <div className="mt-4">
          <AIChatInterface
            meetingId={meeting.id}
            transcripts={transcripts}
            speakers={speakers}
            isVisible={showAIChat}
            onClose={() => setShowAIChat(false)}
          />
        </div>
      )}
    </div>
  );
};

export default MeetingDetailView; 