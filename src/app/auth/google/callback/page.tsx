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
            console.log('Google OAuth successful, creating Supabase session for user:', data.user.email);
            
            const userId = data.user.id;
            
            try {
              // Create a Supabase session using the Google auth data
              if (supabase) {
                // Sign in the user with Supabase using the OAuth data
                const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
                  email: data.user.email,
                  password: `google-oauth-${data.user.id}` // Temporary approach
                });
                
                if (sessionError) {
                  console.log('Supabase session creation failed, using fallback auth');
                  
                  // Fallback: Store user data for AuthProvider to pick up
                  const mockUser = {
                    id: userId,
                    email: data.user.email,
                    user_metadata: {
                      full_name: data.user.name,
                      picture: data.user.picture,
                      provider: 'google'
                    }
                  };
                  
                  const mockSession = {
                    user: mockUser,
                    access_token: data.tokens.access_token,
                    refresh_token: data.tokens.refresh_token,
                    expires_in: data.tokens.expires_in,
                    token_type: 'bearer'
                  };
                  
                  // Store for AuthProvider
                  localStorage.setItem('google_user', JSON.stringify(data.user));
                  localStorage.setItem('auth_session', JSON.stringify(mockSession));
                  localStorage.setItem('isAuthenticated', 'true');
                  localStorage.setItem('currentUserId', userId);
                } else {
                  console.log('Supabase session created successfully');
                }
              } else {
                console.log('No Supabase client, using fallback auth storage');
                
                // Fallback: Store user data for AuthProvider to pick up
                const mockUser = {
                  id: userId,
                  email: data.user.email,
                  user_metadata: {
                    full_name: data.user.name,
                    picture: data.user.picture,
                    provider: 'google'
                  }
                };
                
                const mockSession = {
                  user: mockUser,
                  access_token: data.tokens.access_token,
                  refresh_token: data.tokens.refresh_token,
                  expires_in: data.tokens.expires_in,
                  token_type: 'bearer'
                };
                
                // Store for AuthProvider
                localStorage.setItem('google_user', JSON.stringify(data.user));
                localStorage.setItem('auth_session', JSON.stringify(mockSession));
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('currentUserId', userId);
              }
              
              // Clear timeout and redirect
              clearTimeout(timeout);
              console.log('Redirecting to dashboard...');
              
              // Redirect to dashboard where authenticated users should go
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 100);
              
            } catch (authError) {
              console.error('Error setting up authentication:', authError);
              clearTimeout(timeout);
              router.push('/login?error=auth_setup_failed');
            }
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