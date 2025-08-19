'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { useAuth } from '../auth/AuthProvider';
import { User, Settings, LogOut, LayoutDashboard, CreditCard, ChevronDown } from '../../lib/icons';

export interface NavigationProps {
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const navItems: NavItem[] = [
    { label: 'Practice', href: '/practice' },
    { label: 'Mock Interviews', href: '/mock-interviews' },
    { label: 'Resources', href: '/resources' },
    { label: 'Achievements', href: '/achievements' }
  ];


  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleSignOut = async () => {
    try {
      const result = await signOut();
      setShowProfileMenu(false);
      
      if (result.success) {
        // Redirect to home page
        router.push('/');
      } else {
        console.error('Sign out error:', result.error);
        // Still redirect on error
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even on error
      router.push('/');
    }
  };

  const getUserInitials = () => {
    const displayName = profile?.name || user?.user_metadata?.full_name;
    if (displayName && displayName !== 'Google User') {
      const names = displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    const displayName = profile?.name || user?.user_metadata?.full_name;
    if (displayName && displayName !== 'Google User') {
      return displayName;
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      // Convert email prefix to a more readable format
      return emailName.replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    return 'User';
  };

  return (
    <nav className={cn('fixed top-0 w-full z-50 fade-in-down', className)}>
      {/* Glass morphism backdrop */}
      <div className="glass-light border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-xl font-bold gradient-text-primary hidden sm:block">
                  Interview Prep
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                        'hover:bg-white/50',
                        isActive 
                          ? 'text-blue-600 bg-white/30' 
                          : 'text-gray-900 hover:text-gray-900 font-medium'
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {getUserInitials()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {getUserDisplayName()}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      
                      <Link
                        href="/pricing"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 mr-3" />
                        Subscription
                      </Link>
                      
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
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
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150',
                    'hover:bg-white/50',
                    isActive 
                      ? 'text-blue-600 bg-white/30' 
                      : 'text-gray-900 hover:text-gray-900 font-medium'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            
            {/* Mobile Auth Section */}
            <div className="pt-4 pb-2 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link href="/dashboard" className="block">
                    <Button variant="ghost" size="sm" fullWidth className="justify-start">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/pricing" className="block">
                    <Button variant="ghost" size="sm" fullWidth className="justify-start">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Subscription
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth 
                    onClick={handleSignOut}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      fullWidth
                      className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" className="block">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      fullWidth
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export { Navigation };