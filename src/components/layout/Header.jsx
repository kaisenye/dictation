import { Search, Plus, Settings, Circle, ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { useMeetingStore } from '../../stores/meetingStore.js';
import { MEETING_STATES } from '../../utils/constants.js';

const Header = ({ onNewMeeting, onSearch, onSettings, onHome, onBack, onForward, canGoBack, canGoForward }) => {
  const { currentMeeting, meetingState } = useMeetingStore();

  const getStatusColor = () => {
    switch (meetingState) {
      case MEETING_STATES.RECORDING:
        return 'text-green-500';
      case MEETING_STATES.PAUSED:
        return 'text-amber-500';
      case MEETING_STATES.PROCESSING:
        return 'text-blue-500';
      case MEETING_STATES.ERROR:
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (meetingState) {
      case MEETING_STATES.RECORDING:
        return 'Recording';
      case MEETING_STATES.PAUSED:
        return 'Paused';
      case MEETING_STATES.PROCESSING:
        return 'Processing';
      case MEETING_STATES.ERROR:
        return 'Error';
      default:
        return 'Ready';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 pt-10 pb-4">
      <div className="flex items-center justify-between">
        {/* Navigation and Title */}
        <div className="flex items-center space-x-4">
          {/* Navigation Buttons */}
          <div className="flex items-center space-x-1">
            <Button
              data-testid="back-button"
              variant="secondary"
              size="sm"
              onClick={onBack}
              disabled={!canGoBack}
              className="!p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Button
              data-testid="forward-button"
              variant="secondary"
              size="sm"
              onClick={onForward}
              disabled={!canGoForward}
              className="!p-2"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <Circle className={`w-3 h-3 fill-current ${getStatusColor()}`} />
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Current Meeting Info */}
        {currentMeeting && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {currentMeeting.title}
              </div>
              <div className="text-xs text-gray-500">
                Started {new Date(currentMeeting.start_time).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <Button
            data-testid="search-button"
            variant="ghost"
            size="sm"
            onClick={onSearch}
            className="p-2"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* New Meeting */}
          <Button
            data-testid="new-meeting-button"
            variant="primary"
            size="sm"
            onClick={onNewMeeting}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Meeting</span>
          </Button>

          {/* Settings */}
          <Button
            data-testid="settings-button"
            variant="ghost"
            size="sm"
            onClick={onSettings}
            className="p-2"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header; 