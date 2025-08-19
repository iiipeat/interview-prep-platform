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

  console.log('🔄 Auth callback received:', { code: code ? 'present' : 'missing', error, next })

  if (error) {
    console.error('❌ Auth callback error:', error, errorDescription)
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    try {
      console.log('🔄 Processing OAuth callback with code:', code.substring(0, 20) + '...')
      
      // Use Supabase to exchange the code for a session
      const supabase = createRouteHandlerClient({ cookies })
      
      if (!supabase) {
        console.log('⚠️ Supabase client not available, using simple redirect')
        const redirectUrl = new URL(next, requestUrl.origin)
        redirectUrl.searchParams.set('auth', 'success')
        return NextResponse.redirect(redirectUrl)
      }

      // Exchange the code for a session
      const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (authError) {
        console.error('❌ Failed to exchange code for session:', authError)
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'Authentication failed. Please try again.')
        return NextResponse.redirect(errorUrl)
      }

      if (authData.session && authData.user) {
        console.log('✅ Session created for user:', authData.user.email)
        
        // Check if user exists in our database, create if not
        if (supabaseAdmin) {
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', authData.user.id)
            .single()

          if (fetchError && fetchError.code === 'PGRST116') {
            // User doesn't exist, create them
            console.log('Creating new user in database:', authData.user.email)
            
            const { error: createError } = await supabaseAdmin
              .from('users')
              .insert({
                id: authData.user.id,
                email: authData.user.email!,
                full_name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name,
                avatar_url: authData.user.user_metadata?.avatar_url || authData.user.user_metadata?.picture,
                provider: authData.user.app_metadata?.provider || 'oauth',
                provider_id: authData.user.user_metadata?.provider_id,
                email_verified: true,
                last_login_at: new Date().toISOString()
              })

            if (createError) {
              console.error('Failed to create user in database:', createError)
            } else {
              console.log('User created successfully in database')
            }
          } else if (!fetchError) {
            // User exists, update last login
            await supabaseAdmin
              .from('users')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', authData.user.id)
          }
        }
        
        // Successful authentication, redirect to the intended page
        const redirectUrl = new URL(next, requestUrl.origin)
        console.log('🎯 Redirecting authenticated user to:', redirectUrl.toString())
        return NextResponse.redirect(redirectUrl)
      }

      // No session created
      throw new Error('No session created')

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