import React, { useState } from 'react'
import useDictationStore from '../../stores/dictationStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Settings, User, Key, Zap } from 'lucide-react'

const Dashboard = ({ onClose }) => {
  const { userPlan, customInstructions, apiKeys, updateCustomInstructions, updateApiKey } = useDictationStore()
  const [localInstructions, setLocalInstructions] = useState(customInstructions)
  const [localApiKeys, setLocalApiKeys] = useState(apiKeys)

  const handleSaveInstructions = () => {
    updateCustomInstructions(localInstructions)
  }

  const handleSaveApiKey = (provider) => {
    updateApiKey(provider, localApiKeys[provider])
  }

  const handleApiKeyChange = (provider, value) => {
    setLocalApiKeys(prev => ({
      ...prev,
      [provider]: value
    }))
  }

  return (
    <div className="w-full h-screen bg-gray-100 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full" />
            </div>
            <div>
              <span className="font-semibold text-lg">Flow</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {userPlan}
              </span>
            </div>
          </div>

          <nav className="space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </div>
          </nav>

          <div className="mt-auto pt-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Try Flow Pro ⚡</h3>
              <p className="text-xs text-gray-600 mb-3">
                Upgrade for unlimited dictation and other pro features
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Learn more
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, User</h1>
                <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span>1 week</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>✏️ 112 words</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>👆 42 WPM</span>
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={onClose}>
                Close Dashboard
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl space-y-8">
              {/* Plan Information */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Current Plan</h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{userPlan} Plan</h3>
                      <p className="text-gray-600 text-sm">
                        {userPlan === 'Basic' 
                          ? 'Limited dictation features with local processing'
                          : 'Unlimited dictation with advanced AI features'
                        }
                      </p>
                    </div>
                    {userPlan === 'Basic' && (
                      <Button variant="primary">
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                </div>
              </section>

              {/* Custom Instructions */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Agent Mode Instructions</h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Customize how the AI agent processes and responds to your dictation in agent mode.
                  </p>
                  <div className="space-y-3">
                    <textarea
                      value={localInstructions}
                      onChange={(e) => setLocalInstructions(e.target.value)}
                      placeholder="Enter custom instructions for agent mode (e.g., 'Always format as bullet points', 'Use professional tone', etc.)"
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {localInstructions.length}/500 characters
                      </span>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={handleSaveInstructions}
                        disabled={localInstructions === customInstructions}
                      >
                        Save Instructions
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* API Keys */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <Key className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Remote LLM Services</h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Connect external AI services for enhanced processing capabilities. Your keys are stored locally and encrypted.
                    </p>
                    
                    {/* OpenAI */}
                    <div className="space-y-3 mb-6">
                      <h3 className="font-medium">OpenAI API</h3>
                      <div className="flex space-x-2">
                        <Input
                          type="password"
                          placeholder="sk-..."
                          value={localApiKeys.openai}
                          onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleSaveApiKey('openai')}
                          disabled={localApiKeys.openai === apiKeys.openai}
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    {/* Claude */}
                    <div className="space-y-3">
                      <h3 className="font-medium">Anthropic Claude API</h3>
                      <div className="flex space-x-2">
                        <Input
                          type="password"
                          placeholder="sk-ant-..."
                          value={localApiKeys.claude}
                          onChange={(e) => handleApiKeyChange('claude', e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleSaveApiKey('claude')}
                          disabled={localApiKeys.claude === apiKeys.claude}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
    </div>
  )
}

export default Dashboard