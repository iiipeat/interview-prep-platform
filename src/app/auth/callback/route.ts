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
      console.log('🔄 Processing OAuth callback with code:', code.substring(0, 20) + '...')
      
      if (!supabaseAdmin) {
        console.error('❌ Supabase admin client not configured')
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'Database not configured')
        return NextResponse.redirect(errorUrl)
      }
      
      const supabase = createRouteHandlerClient({ cookies })
      
      // Exchange code for session
      if (!supabase) {
        console.error('❌ Supabase client not initialized')
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'Database connection error')
        return NextResponse.redirect(errorUrl)
      }
      
      console.log('🔄 Exchanging code for session...')
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('❌ Error exchanging code for session:', sessionError)
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'Authentication failed. Please try again.')
        return NextResponse.redirect(errorUrl)
      }

      if (sessionData.user) {
        console.log('✅ Session created for user:', sessionData.user.id, sessionData.user.email)
        
        // Check if this is a new user (OAuth signup)
        const isNewUser = sessionData.user.email_confirmed_at && 
                          new Date(sessionData.user.email_confirmed_at).getTime() > 
                          new Date(Date.now() - 300000).getTime() // Within last 5 minutes (increased window)

        console.log('🔍 Checking if user exists in database:', sessionData.user.id)
        
        // Ensure user exists in our database
        const { data: existingUser, error: userCheckError } = await supabaseAdmin!
          .from('users')
          .select('id, email, full_name')
          .eq('id', sessionData.user.id)
          .single()
          
        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.error('❌ Error checking existing user:', userCheckError)
        }

        if (!existingUser) {
          console.log('🆕 Creating new user record for:', sessionData.user.email)
          
          const userData = {
            id: sessionData.user.id,
            email: sessionData.user.email!,
            full_name: sessionData.user.user_metadata?.full_name || 
                      sessionData.user.user_metadata?.name || 
                      sessionData.user.email?.split('@')[0] || 'User',
            avatar_url: sessionData.user.user_metadata?.avatar_url || 
                       sessionData.user.user_metadata?.picture || null,
            provider: sessionData.user.app_metadata?.provider || 'google',
            provider_id: sessionData.user.user_metadata?.sub || 
                        sessionData.user.user_metadata?.provider_id || null,
            email_verified: true,
            last_login_at: new Date().toISOString(),
          }
          
          console.log('👤 User data to insert:', JSON.stringify(userData, null, 2))
          
          // Create user profile for OAuth users
          const { data: insertedUser, error: insertError } = await supabaseAdmin!
            .from('users')
            .insert(userData)
            .select()
            .single()

          if (insertError) {
            console.error('❌ Error creating user profile:', insertError)
            // Continue with auth flow even if user creation fails
          } else {
            console.log('✅ User created successfully:', insertedUser?.email)
            
            // Set up 7-day free trial for new users
            try {
              console.log('🎁 Setting up free trial for new user...')
              
              // Get or create free trial plan
              let { data: freePlan, error: planError } = await supabaseAdmin!
                .from('subscription_plans')
                .select('id')
                .eq('name', 'Free Trial')
                .single()

              if (planError || !freePlan) {
                console.log('📝 Creating Free Trial plan...')
                const { data: newPlan, error: createPlanError } = await supabaseAdmin!
                  .from('subscription_plans')
                  .insert({
                    name: 'Free Trial',
                    description: '7-day free trial with 5 questions per day',
                    max_sessions_per_day: 5,
                    max_questions_per_session: 10,
                    features: { trial: true },
                    is_active: true
                  })
                  .select()
                  .single()
                
                if (createPlanError) {
                  console.error('❌ Error creating trial plan:', createPlanError)
                } else {
                  freePlan = newPlan
                }
              }

              if (freePlan) {
                const trialEndDate = new Date()
                trialEndDate.setDate(trialEndDate.getDate() + 7)

                const { error: subscriptionError } = await supabaseAdmin!
                  .from('user_subscriptions')
                  .insert({
                    user_id: sessionData.user.id,
                    plan_id: freePlan.id,
                    status: 'trial',
                    trial_start_date: new Date().toISOString(),
                    trial_end_date: trialEndDate.toISOString(),
                  })
                
                if (subscriptionError) {
                  console.error('❌ Error creating subscription:', subscriptionError)
                } else {
                  console.log('✅ Free trial set up successfully')
                }
              }
            } catch (trialError) {
              console.error('❌ Error setting up trial:', trialError)
              // Don't fail the auth flow if trial setup fails
            }
          }
        } else {
          console.log('🔄 Updating last login for existing user:', existingUser.email)
          // Update last login for existing users
          await supabaseAdmin!
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', sessionData.user.id)
        }
      }

      // Redirect to the intended destination
      console.log('🎯 Redirecting to:', next)
      const redirectUrl = new URL(next, requestUrl.origin)
      return NextResponse.redirect(redirectUrl)

    } catch (error) {
      console.error('❌ Auth callback error:', error)
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', 'Authentication failed. Please try again.')
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code parameter, redirect to login
  console.log('❌ No OAuth code found, redirecting to login')
  const loginUrl = new URL('/login', requestUrl.origin)
  return NextResponse.redirect(loginUrl)
}