import React, { useState } from 'react'
import useDictationStore from '../../stores/dictationStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { LayoutDashboard, Settings, User, Key, Zap } from 'lucide-react'

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
    setLocalApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }))
  }

  return (
    <div
      className="w-full h-screen bg-neutral-900 flex overflow-hidden"
      style={{ borderRadius: '12px', overflow: 'hidden' }}
    >
      {/* Title Bar Area - Draggable region for traffic light integration */}
      <div
        className="absolute top-0 left-0 right-0 h-12 bg-neutral-800 border-b border-neutral-700 flex items-center px-6 z-50"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <div className="flex items-center space-x-2 ml-16">
          {' '}
          {/* Left margin for traffic lights */}
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-base text-neutral-100">romo</span>
            {/* <span className="flex items-center px-2 py-1 bg-neutral-700 text-neutral-50 text-[10px] rounded-lg">
              {userPlan}
            </span> */}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-48 bg-neutral-800 border-r border-neutral-700 px-4 py-6" style={{ paddingTop: '65px' }}>
        <nav className="space-y-2 text-xs">
          <div className="flex items-center space-x-3 px-3 py-2 bg-neutral-700 text-neutral-200 rounded-lg hover:bg-neutral-600 cursor-pointer transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            <span className="font-medium flex items-center">Dashboard</span>
          </div>
          <div className="flex items-center space-x-3 px-3 py-2 bg-neutral-700 text-neutral-200 rounded-lg hover:bg-neutral-600 cursor-pointer transition-colors">
            <Settings className="w-4 h-4" />
            <span className="font-medium flex items-center">Settings</span>
          </div>
        </nav>

        <div className="mt-auto pt-8">
          <div className="bg-neutral-700 rounded-lg p-4 border border-neutral-600">
            <h3 className="font-semibold text-sm mb-2 text-neutral-100">Try Flow Pro ⚡</h3>
            <p className="text-xs text-neutral-300 mb-3">Upgrade for unlimited dictation and other pro features</p>
            <Button variant="secondary" size="sm" className="w-full">
              Learn more
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ paddingTop: '55px' }}>
        {/* Header */}
        <div className="border-b border-neutral-700 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-neutral-100">Welcome back, User</h1>
              <div className="flex items-center space-x-6 mt-2 text-xs text-neutral-400">
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-orange-400" />
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
                <User className="w-5 h-5 text-neutral-400" />
                <h2 className="text-base font-semibold text-neutral-100">Current Plan</h2>
              </div>
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-base text-neutral-100">{userPlan} Plan</h3>
                    <p className="text-neutral-400 text-xs">
                      {userPlan === 'Basic'
                        ? 'Limited dictation features with local processing'
                        : 'Unlimited dictation with advanced AI features'}
                    </p>
                  </div>
                  {userPlan === 'Basic' && <Button variant="primary">Upgrade to Pro</Button>}
                </div>
              </div>
            </section>

            {/* Custom Instructions */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-neutral-400" />
                <h2 className="text-base font-semibold text-neutral-100">Agent Mode Instructions</h2>
              </div>
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <p className="text-xs text-neutral-400 mb-3">
                  Customize how the AI agent processes and responds to your dictation in agent mode.
                </p>
                <div className="space-y-3">
                  <textarea
                    value={localInstructions}
                    onChange={(e) => setLocalInstructions(e.target.value)}
                    placeholder="Enter custom instructions for agent mode (e.g., 'Always format as bullet points', 'Use professional tone', etc.)"
                    className="w-full h-32 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-100 placeholder-neutral-500"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-500">{localInstructions.length}/500 characters</span>
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
                <Key className="w-5 h-5 text-neutral-400" />
                <h2 className="text-base font-semibold text-neutral-100">Remote LLM Services</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-4">
                    Connect external AI services for enhanced processing capabilities. Your keys are stored locally and
                    encrypted.
                  </p>

                  {/* OpenAI */}
                  <div className="space-y-3 mb-6">
                    <h3 className="font-medium text-sm text-neutral-200">OpenAI API</h3>
                    <div className="flex space-x-2">
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={localApiKeys.openai}
                        onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                        className="flex-1 bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-500"
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
                    <h3 className="font-medium text-sm text-neutral-200">Anthropic Claude API</h3>
                    <div className="flex space-x-2">
                      <Input
                        type="password"
                        placeholder="sk-ant-..."
                        value={localApiKeys.claude}
                        onChange={(e) => handleApiKeyChange('claude', e.target.value)}
                        className="flex-1 bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-500"
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
