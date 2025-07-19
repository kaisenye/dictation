import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  dataTestId,
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;

  const variants = {
    primary: `
      bg-gray-900 text-white 
      hover:bg-gray-800 active:bg-gray-900
      border border-gray-900
    `,
    secondary: `
      bg-white text-gray-900 
      hover:bg-gray-50 active:bg-gray-100
      border border-gray-200
    `,
    outline: `
      bg-transparent text-gray-700 
      hover:bg-gray-50 active:bg-gray-100
      border border-gray-300
    `,
    ghost: `
      bg-transparent text-gray-700 
      hover:bg-gray-100 active:bg-gray-200
      border border-transparent
    `,
    danger: `
      bg-red-500 text-white 
      hover:bg-red-600 active:bg-red-700
      border border-red-500
    `,
    success: `
      bg-green-500 text-white 
      hover:bg-green-600 active:bg-green-700
      border border-green-500
    `
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-8 py-4 text-lg h-14'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  return (
    <button
      data-testid={dataTestId}
      ref={ref}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className={`animate-spin -ml-1 mr-2 ${iconSizes[size]}`}
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 