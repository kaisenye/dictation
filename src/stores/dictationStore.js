import { create } from 'zustand'

const useDictationStore = create((set) => ({
  // State
  isRecording: false,
  isProcessing: false,
  transcription: '',
  error: null,
  isWindowVisible: false,
  isAgentMode: false,

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

  toggleAgentMode: () => {
    set((state) => {
      const newMode = !state.isAgentMode
      console.log('🔄 STORE: toggleAgentMode called, changing from', state.isAgentMode, 'to', newMode)
      return { isAgentMode: newMode }
    })
  },

  setAgentMode: (isAgentMode) => {
    set({ isAgentMode })
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
