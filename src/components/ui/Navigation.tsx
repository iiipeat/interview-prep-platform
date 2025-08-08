'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface NavigationProps {
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const navItems: NavItem[] = [
    { label: 'Practice', href: '/practice' },
    { label: 'Mock Interviews', href: '/mock-interviews' },
    { label: 'Resources', href: '/resources' },
    { label: 'Achievements', href: '/achievements' }
  ];

  return (
    <nav className={cn('fixed top-0 w-full z-50 fade-in-down', className)}>
      {/* Glass morphism backdrop */}
      <div className="glass-light border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-xl font-bold gradient-text-primary hidden sm:block">
                  Interview Prep
                </span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      'hover:glass-light hover:scale-105',
                      item.active 
                        ? 'text-blue-600 glass-light' 
                        : 'text-gray-900 hover:text-gray-900 font-medium'
                    )}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="glass-light rounded-md p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={cn('h-6 w-6 transition-transform duration-200', {
                    'rotate-45': isOpen
                  })}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={cn(
            'md:hidden transition-all duration-300 ease-in-out',
            isOpen 
              ? 'max-h-96 opacity-100' 
              : 'max-h-0 opacity-0 overflow-hidden'
          )}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 glass-medium border-t border-white/20">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-medium transition-all duration-200',
                  'hover:glass-light',
                  item.active 
                    ? 'text-blue-600 glass-light' 
                    : 'text-gray-900 hover:text-gray-900 font-medium'
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            
            {/* Mobile Auth Buttons */}
            <div className="pt-4 pb-2 space-y-2">
              <Button variant="ghost" size="sm" fullWidth>
                Sign In
              </Button>
              <Button variant="primary" size="sm" fullWidth>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export { Navigation };