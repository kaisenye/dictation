import { create } from 'zustand';
import { MEETING_STATES, PLATFORMS } from '../utils/constants.js';

export const useMeetingStore = create((set, get) => ({
  // State
  meetings: [],
  currentMeeting: null,
  meetingState: MEETING_STATES.IDLE,
  isLoading: false,
  error: null,
  
  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  // Initialize store and load meetings
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      await window.electronAPI.initializeDatabase();
      const meetings = await window.electronAPI.getAllMeetings();
      set({ meetings, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize meeting store:', error);
      set({ error: error.message, isLoading: false, meetings: [] });
    }
  },
  
  // Load all meetings
  loadMeetings: async (limit = 50, offset = 0) => {
    try {
      set({ isLoading: true, error: null });
      const meetings = await window.electronAPI.getAllMeetings(limit, offset);
      set({ meetings, isLoading: false });
      return meetings;
    } catch (error) {
      console.error('Failed to load meetings:', error);
      set({ error: error.message, isLoading: false, meetings: [] });
      return [];
    }
  },
  
  // Create a new meeting
  createMeeting: async (meetingData) => {
    try {
      set({ error: null });
      const meetingId = await window.electronAPI.createMeeting({
        title: meetingData.title,
        platform: meetingData.platform || PLATFORMS.MANUAL,
        startTime: meetingData.startTime || new Date().toISOString(),
        participantCount: meetingData.participantCount
      });
      
      const newMeeting = await window.electronAPI.getMeeting(meetingId);
      
      set(state => ({
        meetings: [newMeeting, ...state.meetings],
        currentMeeting: newMeeting,
        meetingState: MEETING_STATES.RECORDING
      }));
      
      return newMeeting;
    } catch (error) {
      console.error('Failed to create meeting:', error);
      set({ error: error.message });
      return null;
    }
  },
  
  // Update meeting
  updateMeeting: async (meetingId, updates) => {
    try {
      set({ error: null });
      await window.electronAPI.updateMeeting(meetingId, updates);
      const updatedMeeting = await window.electronAPI.getMeeting(meetingId);
      
      set(state => ({
        meetings: state.meetings.map(meeting => 
          meeting.id === meetingId ? updatedMeeting : meeting
        ),
        currentMeeting: state.currentMeeting?.id === meetingId ? 
          updatedMeeting : state.currentMeeting
      }));
      
      return updatedMeeting;
    } catch (error) {
      console.error('Failed to update meeting:', error);
      set({ error: error.message });
      return null;
    }
  },
  
  // End current meeting
  endMeeting: async (meetingId) => {
    try {
      set({ error: null });
      const endTime = new Date().toISOString();
      const meeting = await window.electronAPI.getMeeting(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      const startTime = new Date(meeting.start_time);
      const duration = Math.floor((new Date(endTime) - startTime) / 1000);
      
      await window.electronAPI.endMeeting(meetingId, endTime, duration);
      const updatedMeeting = await window.electronAPI.getMeeting(meetingId);
      
      set(state => ({
        meetings: state.meetings.map(m => 
          m.id === meetingId ? updatedMeeting : m
        ),
        currentMeeting: null,
        meetingState: MEETING_STATES.COMPLETED
      }));
      
      return updatedMeeting;
    } catch (error) {
      console.error('Failed to end meeting:', error);
      set({ error: error.message });
      return null;
    }
  },
  
  // Delete meeting
  deleteMeeting: async (meetingId) => {
    try {
      set({ error: null });
      await window.electronAPI.deleteMeeting(meetingId);
      
      set(state => ({
        meetings: state.meetings.filter(meeting => meeting.id !== meetingId),
        currentMeeting: state.currentMeeting?.id === meetingId ? 
          null : state.currentMeeting
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      set({ error: error.message });
      return false;
    }
  },
  
  // Set current meeting
  setCurrentMeeting: (meeting) => {
    set({ currentMeeting: meeting });
  },
  
  // Set meeting state
  setMeetingState: (state) => {
    set({ meetingState: state });
  },
  
  // Get meeting by ID
  getMeetingById: async (meetingId) => {
    try {
      const meeting = await window.electronAPI.getMeeting(meetingId);
      return meeting;
    } catch (error) {
      console.error('Failed to get meeting:', error);
      set({ error: error.message });
      return null;
    }
  },
  
  // Search meetings
  searchMeetings: async (query) => {
    try {
      set({ isLoading: true, error: null });
      const meetings = get().meetings.filter(meeting =>
        meeting.title.toLowerCase().includes(query.toLowerCase())
      );
      set({ isLoading: false });
      return meetings;
    } catch (error) {
      console.error('Failed to search meetings:', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
  
  // Get meeting statistics
  getMeetingStats: async () => {
    try {
      const stats = await window.electronAPI.getMeetingStats();
      return stats;
    } catch (error) {
      console.error('Failed to get meeting stats:', error);
      set({ error: error.message });
      return null;
    }
  }
})); 