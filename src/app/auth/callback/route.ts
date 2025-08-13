import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

/**
 * Auth callback route for OAuth providers and email confirmations
 * Handles the redirect after successful authentication
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    const errorUrl = new URL('/auth/login', requestUrl.origin)
    errorUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    try {
    if (!supabaseAdmin) {
      return errorResponse("Database not configured", 500);
    }
      const supabase = createRouteHandlerClient({ cookies })
      
      // Exchange code for session
      if (!supabase) return;
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Error exchanging code for session:', sessionError)
        const errorUrl = new URL('/auth/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'Authentication failed. Please try again.')
        return NextResponse.redirect(errorUrl)
      }

      if (sessionData.user) {
        // Check if this is a new user (OAuth signup)
        const isNewUser = sessionData.user.email_confirmed_at && 
                          new Date(sessionData.user.email_confirmed_at).getTime() > 
                          new Date(Date.now() - 60000).getTime() // Within last minute

        // Ensure user exists in our database
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', sessionData.user.id)
          .single()

        if (!existingUser) {
          // Create user profile for OAuth users
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: sessionData.user.id,
              email: sessionData.user.email!,
              full_name: sessionData.user.user_metadata?.full_name || 
                        sessionData.user.user_metadata?.name || 
                        sessionData.user.email?.split('@')[0],
              avatar_url: sessionData.user.user_metadata?.avatar_url || 
                         sessionData.user.user_metadata?.picture,
              provider: sessionData.user.app_metadata?.provider || 'email',
              provider_id: sessionData.user.user_metadata?.sub || 
                          sessionData.user.user_metadata?.provider_id,
              email_verified: true,
              last_login_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('Error creating user profile:', insertError)
          } else if (isNewUser) {
            // Set up 7-day free trial for new users
            try {
              // Get free trial plan
              const { data: freePlan } = await supabaseAdmin
                .from('subscription_plans')
                .select('id')
                .eq('name', 'Free Trial')
                .single()

              if (freePlan) {
                const trialEndDate = new Date()
                trialEndDate.setDate(trialEndDate.getDate() + 7)

                await supabaseAdmin
                  .from('user_subscriptions')
                  .insert({
                    user_id: sessionData.user.id,
                    plan_id: freePlan.id,
                    status: 'trial',
                    trial_start_date: new Date().toISOString(),
                    trial_end_date: trialEndDate.toISOString(),
                  })
              }
            } catch (trialError) {
              console.error('Error setting up trial:', trialError)
              // Don't fail the auth flow if trial setup fails
            }
          }
        } else {
          // Update last login for existing users
          await supabaseAdmin
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', sessionData.user.id)
        }
      }

      // Redirect to the intended destination
      const redirectUrl = new URL(next, requestUrl.origin)
      return NextResponse.redirect(redirectUrl)

    } catch (error) {
      console.error('Auth callback error:', error)
      const errorUrl = new URL('/auth/login', requestUrl.origin)
      errorUrl.searchParams.set('error', 'Authentication failed. Please try again.')
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code parameter, redirect to login
  const loginUrl = new URL('/auth/login', requestUrl.origin)
  return NextResponse.redirect(loginUrl)
}