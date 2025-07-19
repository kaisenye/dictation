import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, FileText, Trash2, Eye } from 'lucide-react';
import { useMeetingStore } from '../../stores/meetingStore.js';
import { formatMeetingDate, formatDuration } from '../../utils/dateFormatter.js';
import { PLATFORMS } from '../../utils/constants.js';
import Button from '../ui/Button.jsx';

const MeetingCard = ({ meeting, onView, onDelete }) => {
  const platformIcons = {
    [PLATFORMS.ZOOM]: '🔷',
    [PLATFORMS.TEAMS]: '🟪',
    [PLATFORMS.MEET]: '🟢',
    [PLATFORMS.MANUAL]: '📝'
  };

  return (
    <div 
      data-testid={`meeting-card-${meeting.id}`}
      className="bg-white rounded-lg border-2 border-gray-100 px-6 py-4 hover:border-gray-200 transition-colors cursor-pointer"
      onClick={() => onView(meeting)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 data-testid="meeting-card-title" className="text-base font-semibold text-gray-800 mb-2">
            {meeting.title}
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span data-testid="meeting-date">{formatMeetingDate(meeting.start_time)}</span>
            </div>
            
            {meeting.duration && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span data-testid="meeting-duration">{formatDuration(meeting.duration)}</span>
              </div>
            )}
            
            {meeting.platform && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span data-testid="meeting-platform">{meeting.platform}</span>
              </div>
            )}
          </div>
          
          {meeting.has_transcription && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <FileText className="w-4 h-4" />
              <span data-testid="transcription-status">Transcription available</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Button
            data-testid={`delete-meeting-btn-${meeting.id}`}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when deleting
              onDelete(meeting.id);
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const MeetingList = ({ onViewMeeting }) => {
  const { meetings, isLoading, loadMeetings, deleteMeeting } = useMeetingStore();

  // Ensure meetings is always an array
  const safetyMeetings = meetings || [];

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleViewMeeting = (meeting) => {
    onViewMeeting?.(meeting);
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      await deleteMeeting(meetingId);
    }
  };

  if (isLoading) {
    return (
      <div data-testid="meeting-list-loading" className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">Loading meetings...</span>
      </div>
    );
  }

  if (safetyMeetings.length === 0) {
    return (
      <div data-testid="empty-meeting-list" className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 data-testid="empty-state-title" className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
        <p data-testid="empty-state-description" className="text-gray-600 mb-4">
          Start your first meeting to see it appear here.
        </p>
        <Button
          data-testid="start-first-meeting-btn"
          variant="primary"
          onClick={() => onViewMeeting?.(null)}
        >
          Start New Meeting
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="meeting-list" className="space-y-4">
      <div data-testid="meeting-cards-container" className="grid gap-4">
        {safetyMeetings.map(meeting => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onView={handleViewMeeting}
            onDelete={handleDeleteMeeting}
          />
        ))}
      </div>
    </div>
  );
};

export default MeetingList; 