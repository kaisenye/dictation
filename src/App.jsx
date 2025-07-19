import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import Header from './components/layout/Header.jsx';
import SettingsPage from './components/layout/SettingsPage.jsx';
import MeetingList from './components/meeting/MeetingList.jsx';
import LiveMeetingView from './components/meeting/LiveMeetingView.jsx';
import MeetingDetailView from './components/meeting/MeetingDetailView.jsx';
import Button from './components/ui/Button.jsx';
import Input from './components/ui/Input.jsx';
import Modal from './components/ui/Modal.jsx';
import { useMeetingStore } from './stores/meetingStore.js';
import { MEETING_STATES, PLATFORMS } from './utils/constants.js';

function App() {
  const [currentView, setCurrentView] = useState('meetings'); // 'meetings', 'meeting-detail', 'settings'
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS.MANUAL);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  // Navigation history
  const [navigationHistory, setNavigationHistory] = useState(['meetings']);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  
  const { 
    initialize, 
    createMeeting, 
    endMeeting,
    currentMeeting,
    meetingState,
    error,
    clearError
  } = useMeetingStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize meeting store
        await initialize();
        
        // Initialize AI service
        if (window.electronAPI && window.electronAPI.aiInitialize) {
          console.log('Initializing AI service...');
          const result = await window.electronAPI.aiInitialize();
          if (result.success) {
            console.log('AI service initialized successfully');
          } else {
            console.error('Failed to initialize AI service:', result.error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    
    initializeApp();
  }, [initialize]);

  const handleNewMeeting = () => {
    setIsNewMeetingModalOpen(true);
    setNewMeetingTitle('');
    setSelectedPlatform(PLATFORMS.MANUAL);
    setSelectedMeeting(null);
  };

  const handleCreateMeeting = async () => {
    if (!newMeetingTitle.trim()) return;
    
    const meeting = await createMeeting({
      title: newMeetingTitle.trim(),
      platform: selectedPlatform,
      startTime: new Date().toISOString()
    });
    
    if (meeting) {
      setIsNewMeetingModalOpen(false);
      setCurrentView('live-meeting');
      setSelectedMeeting(meeting);
    }
  };

  const handleEndMeeting = async () => {
    if (currentMeeting) {
      await endMeeting(currentMeeting.id);
      setCurrentView('meetings');
      setSelectedMeeting(null);
    }
  };

  const handleSaveMeeting = (updatedMeeting, transcriptionResult) => {
    console.log('Meeting saved:', updatedMeeting);
    console.log('Transcription result:', transcriptionResult);
    // Additional save logic can be added here
  };

  const navigateTo = (view, meeting = null) => {
    // Add to history if it's a new navigation
    if (view !== currentView) {
      const newHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
      newHistory.push(view);
      setNavigationHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
    }
    
    setCurrentView(view);
    setSelectedMeeting(meeting);
  };

  const handleViewMeeting = (meeting) => {
    if (meeting) {
      setSelectedMeeting(meeting);
      // Determine which view to show based on meeting status
      if (meeting.status === 'recording' || meeting.status === 'ready') {
        navigateTo('live-meeting', meeting);
      } else {
        navigateTo('meeting-detail', meeting);
      }
    } else {
      handleNewMeeting();
    }
  };

  const handleBackToMeetings = () => {
    navigateTo('meetings');
  };

  const handleOpenSettings = () => {
    navigateTo('settings');
  };

  const handleGoHome = () => {
    navigateTo('meetings');
  };

  const handleGoBack = () => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const previousView = navigationHistory[newIndex];
      setCurrentHistoryIndex(newIndex);
      setCurrentView(previousView);
      
      // Reset selected meeting if going back to meetings
      if (previousView === 'meetings') {
        setSelectedMeeting(null);
      }
    }
  };

  const handleGoForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const nextView = navigationHistory[newIndex];
      setCurrentHistoryIndex(newIndex);
      setCurrentView(nextView);
    }
  };

  const canGoBack = currentHistoryIndex > 0;
  const canGoForward = currentHistoryIndex < navigationHistory.length - 1;

  const handleCloseNewMeetingModal = () => {
    setIsNewMeetingModalOpen(false);
    setNewMeetingTitle('');
    setSelectedPlatform(PLATFORMS.MANUAL);
  };

  const renderNewMeetingForm = () => (
    <div data-testid="new-meeting-form" className="space-y-4">
      <Input
        data-testid="meeting-title-input"
        label="Meeting Title"
        placeholder="Enter meeting title..."
        value={newMeetingTitle}
        onChange={(e) => setNewMeetingTitle(e.target.value)}
        autoFocus
      />

      <div data-testid="platform-selection">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Platform
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PLATFORMS).map(([key, value]) => (
            <button
              key={value}
              data-testid={`platform-option-${value}`}
              onClick={() => setSelectedPlatform(value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedPlatform === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium capitalize">{value}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          data-testid="cancel-new-meeting-btn"
          variant="outline"
          onClick={handleCloseNewMeetingModal}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          data-testid="start-recording-btn"
          variant="primary"
          onClick={handleCreateMeeting}
          disabled={!newMeetingTitle.trim()}
          className="flex-1"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Recording
        </Button>
      </div>
    </div>
  );

  return (
    <div data-testid="app-container" className="min-h-screen bg-gray-50 flex flex-col">
      {/* Error Notification */}
      {error && (
        <div data-testid="error-notification" className="fixed top-20 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              data-testid="dismiss-error-btn"
              onClick={clearError}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header - Fixed at top */}
      <div data-testid="app-header" className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <Header
          onNewMeeting={handleNewMeeting}
          onSearch={() => console.log('Search clicked')}
          onSettings={handleOpenSettings}
          onHome={handleGoHome}
          onBack={handleGoBack}
          onForward={handleGoForward}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
      </div>

      {/* Main Content - With padding for fixed header */}
      <main data-testid="app-main-content" className="flex-1 pt-16 overflow-y-auto">
        <div className="w-fullcontainer mx-auto px-6 py-12">
          {currentView === 'meetings' && (
            <MeetingList onViewMeeting={handleViewMeeting} />
          )}
          
          {currentView === 'live-meeting' && (
            <LiveMeetingView
              meeting={selectedMeeting || currentMeeting}
              onSaveMeeting={handleSaveMeeting}
              onEndMeeting={handleEndMeeting}
            />
          )}
          
          {currentView === 'meeting-detail' && (
            <MeetingDetailView
              meeting={selectedMeeting}
              onBack={handleBackToMeetings}
            />
          )}
          
          {currentView === 'settings' && (
            <SettingsPage onBack={handleBackToMeetings} />
          )}
        </div>
      </main>

      {/* New Meeting Modal */}
      <Modal
        isOpen={isNewMeetingModalOpen}
        onClose={handleCloseNewMeetingModal}
        title="Start New Meeting"
        dataTestId="new-meeting-modal"
      >
        {renderNewMeetingForm()}
      </Modal>
    </div>
  );
}

export default App; 