import React, { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2, MessageSquare, X } from 'lucide-react'
import Button from '../ui/Button'

const AIChatInterface = ({
  meetingId,
  transcripts = [],
  speakers = [],
  isVisible = false,
  onClose,
  className = '',
}) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize Llama.cpp service
  useEffect(() => {
    const initializeService = async () => {
      try {
        const status = await window.electronAPI.llamaGetStatus()
        if (!status.initialized) {
          const result = await window.electronAPI.llamaInitialize()
          if (result.success) {
            setIsInitialized(true)
          } else {
            console.error('Failed to initialize Llama.cpp service:', result.error)
          }
        } else {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Error checking Llama.cpp status:', error)
      }
    }

    if (isVisible) {
      initializeService()
    }
  }, [isVisible])

  // Focus input when chat becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100)
    }
  }, [isVisible])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isInitialized) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newUserMessage])

    try {
      // Get AI response
      const result = await window.electronAPI.llamaAnswerQuestion(userMessage, meetingId, transcripts, speakers)

      if (result.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: result.answer,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        // Add error message
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: `Sorry, I couldn't process your question. ${result.error || 'Please try again.'}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, there was an error processing your question. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    if (meetingId) {
      window.electronAPI.llamaClearHistory(meetingId)
    }
  }

  if (!isVisible) return null

  return (
    <div
      data-testid="ai-chat-interface"
      className={`bg-white rounded-lg border border-gray-200 shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          {!isInitialized && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Initializing...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-gray-500 hover:text-gray-700">
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Ask me anything about this meeting!</p>
            <p className="text-xs mt-1">
              I can help you understand the conversation, find key points, or answer questions.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'ai' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isInitialized ? 'Ask about the meeting...' : 'Initializing...'}
            disabled={!isInitialized || isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || !isInitialized}
            className="px-4 py-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {!isInitialized && (
          <p className="text-xs text-gray-500 mt-2">Initializing AI service... This may take a moment.</p>
        )}
      </div>
    </div>
  )
}

export default AIChatInterface
