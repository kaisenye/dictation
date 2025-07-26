import { create } from 'zustand'

const useDictationStore = create((set) => ({
  // State
  isRecording: false,
  isProcessing: false,
  transcription: '',
  error: null,
  isWindowVisible: false,

  // Actions
  updateTranscription: (text) => {
    set({
      transcription: text,
    })
  },

  setError: (error) => {
    set({ error })
  },

  clearError: () => {
    set({ error: null })
  },

  setWindowVisible: (visible) => {
    set({ isWindowVisible: visible })
  },

  setRecordingState: (isRecording, isProcessing) => {
    set({ isRecording, isProcessing })
  },

  reset: () => {
    set({
      isRecording: false,
      isProcessing: false,
      transcription: '',
      error: null,
    })
  },

}))

export default useDictationStore
