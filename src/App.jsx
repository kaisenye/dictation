import React, { useEffect, useState } from 'react'
import DictationView from './components/dictation/DictationView'
import Dashboard from './components/dashboard/Dashboard'
import useDictationStore from './stores/dictationStore'

function App() {
  const { setWindowVisible } = useDictationStore()
  const [isDashboard, setIsDashboard] = useState(false)

  // Check URL hash for dashboard mode
  useEffect(() => {
    const checkHash = () => {
      setIsDashboard(window.location.hash === '#dashboard')
    }

    checkHash()
    window.addEventListener('hashchange', checkHash)

    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

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
            console.log('Tray dashboard clicked')
            // Dashboard will be opened by the TrayManager in a separate window
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

  // Show dashboard or dictation based on hash
  if (isDashboard) {
    return (
      <div className="w-full h-screen">
        <Dashboard
          onClose={() => {
            // Close the dashboard window
            if (window.electronAPI?.closeDashboard) {
              window.electronAPI.closeDashboard()
            } else {
              window.close()
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <DictationView />
    </div>
  )
}

export default App
