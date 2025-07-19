import React, { useEffect } from 'react'
import DictationView from './components/dictation/DictationView'
import useDictationStore from './stores/dictationStore'

function App() {
  const { setWindowVisible } = useDictationStore()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Make dictation store available globally for useAudioRecording hook
        window.useDictationStore = useDictationStore

        // Initialize AI service
        if (window.electronAPI && window.electronAPI.aiInitialize) {
          console.log('Initializing AI service...')
          const result = await window.electronAPI.aiInitialize()
          if (result.success) {
            console.log('AI service initialized successfully')
          } else {
            console.error('Failed to initialize AI service:', result.error)
          }
        }

        // Handle tray events
        if (window.electronAPI) {
          window.electronAPI.onTrayStartDictation(() => {
            console.log('Tray start dictation clicked')
            // Could trigger recording start here
          })

          window.electronAPI.onTrayOpenSettings(() => {
            console.log('Tray settings clicked')
            // TODO: Open settings
          })
        }

        // Set window as visible
        setWindowVisible(true)
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    initializeApp()
  }, [setWindowVisible])

  return (
    <div className="h-screen">
      <DictationView />
    </div>
  )
}

export default App
