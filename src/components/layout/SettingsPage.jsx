import { ArrowLeft, Monitor, Sun, Moon, Globe } from 'lucide-react';
import Button from '../ui/Button.jsx';

const SettingsPage = ({ onBack }) => {
  return (
    <div data-testid="settings-page" className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <div className="container mx-auto px-6">
          <div className="max-full mx-auto space-y-8">
            {/* Theme Settings */}
            <div data-testid="theme-settings" className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Theme
                </label>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* System Setting */}
                  <button
                    data-testid="theme-system-btn"
                    className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Monitor className="w-6 h-6" />
                      <span className="text-sm font-medium">System</span>
                      <span className="text-xs text-blue-600">Follow OS</span>
                    </div>
                  </button>
                  
                  {/* Light Theme */}
                  <button
                    data-testid="theme-light-btn"
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Sun className="w-6 h-6 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Light</span>
                      <span className="text-xs text-gray-500">Always light</span>
                    </div>
                  </button>
                  
                  {/* Dark Theme */}
                  <button
                    data-testid="theme-dark-btn"
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Moon className="w-6 h-6 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Dark</span>
                      <span className="text-xs text-gray-500">Always dark</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div data-testid="language-settings" className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Language</h2>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Language
                </label>
                
                <div className="space-y-3">
                  {/* English */}
                  <button
                    data-testid="language-english-btn"
                    className="w-full p-4 rounded-lg border-2 border-blue-500 bg-blue-50 text-left hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-700">English</div>
                          <div className="text-sm text-blue-600">English (US)</div>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500"></div>
                    </div>
                  </button>
                  
                  {/* Spanish */}
                  <button
                    data-testid="language-spanish-btn"
                    className="w-full p-4 rounded-lg border-2 border-gray-200 text-left hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-700">Español</div>
                          <div className="text-sm text-gray-500">Spanish</div>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                    </div>
                  </button>
                  
                  {/* French */}
                  <button
                    data-testid="language-french-btn"
                    className="w-full p-4 rounded-lg border-2 border-gray-200 text-left hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-700">Français</div>
                          <div className="text-sm text-gray-500">French</div>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                    </div>
                  </button>
                  
                  {/* German */}
                  <button
                    data-testid="language-german-btn"
                    className="w-full p-4 rounded-lg border-2 border-gray-200 text-left hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-700">Deutsch</div>
                          <div className="text-sm text-gray-500">German</div>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Settings Placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">More Settings</h2>
              <p className="text-gray-600 text-sm">
                Additional settings will be available in future updates.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Moved from App.jsx */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-6 text-center text-sm text-gray-500">
          Made By Kaisen with ❤️
        </div>
      </footer>
    </div>
  );
};

export default SettingsPage; 