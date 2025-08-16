'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.error('Authentication timeout - redirecting to login');
      router.push('/login?error=timeout');
    }, 30000); // 30 second timeout

    async function handleGoogleCallback() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        clearTimeout(timeout);
        router.push('/login?error=oauth_failed');
        return;
      }

      if (code) {
        console.log('Google OAuth code received:', code);
        
        try {
          // Call the API route to exchange the code for user data
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirectUri: window.location.origin + '/auth/google/callback',
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('API response not ok:', response.status, data);
            throw new Error(data.error || 'Failed to authenticate with Google');
          }
          
          console.log('Google authentication successful:', data);

          if (data && data.user) {
            // For development, directly set up the session
            // In production, this would go through proper OAuth validation
            
            // Store user data in localStorage to simulate authentication
            const userId = data.user.id || `google_${Date.now()}`;
            
            console.log('Setting up authentication for user:', userId);
            
            localStorage.setItem('user', JSON.stringify({
              id: userId,
              email: data.user.email,
              name: data.user.name,
              picture: data.user.picture
            }));
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUserId', userId);
            
            // Store Google user data
            localStorage.setItem('google_user', JSON.stringify(data.user));
            
            // Create user in the mock database
            const usersDb = JSON.parse(localStorage.getItem('users_db') || '{}');
            if (!usersDb[userId]) {
              usersDb[userId] = {
                id: userId,
                email: data.user.email,
                name: data.user.name,
                provider: 'google',
                created_at: new Date().toISOString()
              };
              localStorage.setItem('users_db', JSON.stringify(usersDb));
            }
            
            // Create user profile
            const profilesDb = JSON.parse(localStorage.getItem('user_profiles_db') || '{}');
            if (!profilesDb[userId]) {
              profilesDb[userId] = {
                id: userId,
                email: data.user.email,
                name: data.user.name,
                subscriptionStatus: 'trial',
                trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                questionsUsedToday: 0,
                totalQuestions: 0,
                streak: 0,
                achievements: 0,
                successRate: 0,
                preferences: {},
                created_at: new Date().toISOString()
              };
              localStorage.setItem('user_profiles_db', JSON.stringify(profilesDb));
            }
            
            // Clear any return URL
            localStorage.removeItem('authReturnUrl');
            
            // Clear timeout and redirect
            clearTimeout(timeout);
            setTimeout(() => {
              console.log('Redirecting to home page...');
              console.log('Auth status:', localStorage.getItem('isAuthenticated'));
              console.log('User ID:', localStorage.getItem('currentUserId'));
              
              // Force redirect to home page with full page refresh
              window.location.href = '/';
            }, 100);
          } else {
            console.error('No user data in response');
            clearTimeout(timeout);
            router.push('/login?error=auth_failed');
          }
        } catch (error) {
          console.error('Google authentication error:', error);
          clearTimeout(timeout);
          router.push('/login?error=oauth_failed');
        }
      } else {
        clearTimeout(timeout);
        router.push('/login');
      }
    }

    handleGoogleCallback();
    
    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeout);
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in with Google...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}