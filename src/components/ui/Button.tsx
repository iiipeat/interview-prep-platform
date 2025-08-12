import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glass?: 'light' | 'medium' | 'heavy';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children,
    className,
    variant = 'primary',
    size = 'md',
    glass = 'medium',
    fullWidth = false,
    loading = false,
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const baseClasses = 'rounded-lg font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none select-none';
    
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    }, [onClick, disabled, loading]);
    
    const variantClasses = {
      primary: `text-white font-semibold shadow-lg hover:shadow-xl border-0 bg-gradient-to-r from-blue-500 to-purple-600`,
      secondary: `glass-button glass-${glass} text-gray-900 border font-semibold`,
      ghost: 'glass-button hover:bg-white/10 text-gray-900 border-0 font-semibold',
      outline: `glass-button glass-light border-2 text-gray-900 hover:glass-${glass} font-semibold`
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    const widthClasses = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClasses,
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        <span className="flex items-center justify-center gap-2 pointer-events-none">
          {loading && (
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
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
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };