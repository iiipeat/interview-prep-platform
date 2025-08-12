import React from 'react';
import { cn } from '../../lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'light' | 'medium' | 'heavy';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  hover?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    children, 
    className, 
    variant = 'medium', 
    size = 'md', 
    animated = false,
    hover = true,
    ...props 
  }, ref) => {
    const baseClasses = 'rounded-xl transition-all duration-200 ease-out';
    
    const variantClasses = {
      light: 'glass-light',
      medium: 'glass-medium', 
      heavy: 'glass-heavy'
    };
    
    const sizeClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    };
    
    const interactionClasses = hover 
      ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1' 
      : '';
    
    const animationClasses = animated ? 'fade-in-up' : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          interactionClasses,
          animationClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };