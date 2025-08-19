'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        if (!supabase) {
          router.push('/login?error=no_supabase');
          return;
        }

        // Handle the OAuth callback - Supabase automatically processes the session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during OAuth callback:', error);
          router.push('/login?error=auth_error');
          return;
        }

        if (data.session) {
          // User successfully authenticated
          const user = data.session.user;
          
          // Check if user exists in our database, if not create them
          const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

          if (userError && userError.code === 'PGRST116') {
            // User doesn't exist, create them
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('Error creating user profile:', insertError);
              // Continue anyway - user is authenticated
            }
          }

          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          // No session found
          router.push('/login?error=no_session');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_failed');
      }
    }

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}