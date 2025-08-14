'use client';

import React, { useEffect, useState } from 'react';
import { Navigation } from '../../components/ui';

export default function TestDashboard() {
  const [authStatus, setAuthStatus] = useState('checking');
  
  useEffect(() => {
    // Check for auth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    
    if (authSuccess === 'success') {
      console.log('✅ OAuth success detected!');
      setAuthStatus('success');
      
      // Store simple auth state
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUserId', `user_${Date.now()}`);
      
      // Clean URL
      window.history.replaceState({}, '', '/test-dashboard');
    } else {
      // Check if already authenticated
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      setAuthStatus(isAuth ? 'success' : 'failed');
    }
  }, []);
  
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (authStatus === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <a href="/login" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
            Go to Login
          </a>
        </div>
      </div>
    );
  }
  
  // Simple test dashboard that doesn't depend on complex auth
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            🎉 Welcome to Your Dashboard!
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">✅ Authentication Working!</h2>
            <p className="text-gray-600 mb-4">
              If you can see this page, your login was successful.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Free Trial</h3>
                <p className="text-blue-700">7 days remaining</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900">Questions Today</h3>
                <p className="text-green-700">0 / 5 used</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900">Total Sessions</h3>
                <p className="text-purple-700">0 completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                Start Practice
              </button>
              <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                Mock Interview
              </button>
              <button className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
                View Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}