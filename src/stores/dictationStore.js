import { create } from 'zustand'

const useDictationStore = create((set, get) => ({
  // State
  isRecording: false,
  isProcessing: false,
  transcription: '',
  processedTranscription: '',
  useCase: 'auto', // 'auto', 'email', 'document', 'note', 'code', 'meeting', 'social_media', 'creative_writing', 'technical', 'casual'
  wordCount: 0,
  duration: 0,
  startTime: null,
  error: null,
  isWindowVisible: false,
  isPostProcessing: false,

  // Actions
  startRecording: () => {
    set({
      isRecording: true,
      startTime: Date.now(),
      transcription: '',
      processedTranscription: '',
      wordCount: 0,
      duration: 0,
      error: null,
    })
  },

  stopRecording: () => {
    set({
      isRecording: false,
      duration: Date.now() - get().startTime,
    })
  },

  updateTranscription: (text) => {
    const wordCount = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
    set({
      transcription: text,
      wordCount,
      duration: get().startTime ? Date.now() - get().startTime : 0,
    })
  },

  setProcessedTranscription: (text) => {
    set({
      processedTranscription: text,
      isPostProcessing: false,
    })
  },

  setUseCase: (useCase) => {
    set({ useCase })
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

  startPostProcessing: () => {
    set({ isPostProcessing: true })
  },

  setRecordingState: (isRecording, isProcessing) => {
    set({ isRecording, isProcessing })
  },

  reset: () => {
    set({
      isRecording: false,
      isProcessing: false,
      transcription: '',
      processedTranscription: '',
      useCase: 'auto',
      wordCount: 0,
      duration: 0,
      startTime: null,
      error: null,
      isPostProcessing: false,
    })
  },

  // Computed values
  getFormattedDuration: () => {
    const { duration } = get()
    if (duration === 0) return '00:00'

    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  },

  getTranscriptionToCopy: () => {
    const { processedTranscription, transcription } = get()
    return processedTranscription || transcription
  },
}))

export default useDictationStore
