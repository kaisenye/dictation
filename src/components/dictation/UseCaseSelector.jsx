import React from 'react';
import { ChevronDown } from 'lucide-react';
import { USE_CASES } from '../../utils/constants';

const USE_CASE_LABELS = {
  auto: 'Auto-detect',
  email: 'Email',
  document: 'Document',
  note: 'Note',
  code: 'Code',
  meeting: 'Meeting',
  social_media: 'Social Media',
  creative_writing: 'Creative Writing',
  technical: 'Technical',
  casual: 'Casual'
};

const UseCaseSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (useCase) => {
    onChange(useCase);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <span className="text-gray-700">{USE_CASE_LABELS[value]}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          <div className="py-1">
            {Object.entries(USE_CASES).map(([key, useCase]) => (
              <button
                key={useCase}
                onClick={() => handleSelect(useCase)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                  value === useCase ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {USE_CASE_LABELS[useCase]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UseCaseSelector; 