import React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function LinkButton({ href, children, className, disabled }: LinkButtonProps) {
  if (disabled) {
    return (
      <div className={cn('opacity-50 cursor-not-allowed', className)}>
        {children}
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className={cn('block select-none', className)}
      onClick={(e) => {
        // Prevent double clicks
        const target = e.currentTarget;
        if (target.dataset.clicked === 'true') {
          e.preventDefault();
          return;
        }
        target.dataset.clicked = 'true';
        setTimeout(() => {
          delete target.dataset.clicked;
        }, 1000);
      }}
    >
      {children}
    </Link>
  );
}