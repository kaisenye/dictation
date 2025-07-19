import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  className = '',
  type = 'text',
  size = 'md',
  ...props 
}, ref) => {
  const baseClasses = `
    w-full rounded-lg border transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
    ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500' : 
      'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'}
    ${className}
  `;

  const sizes = {
    sm: 'px-3 py-2 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-4 py-3 text-base h-12'
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`${baseClasses} ${sizes[size]}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 