import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
// import { googleSheetsSync } from '../../../../lib/google-sheets-sync' // Disabled for now

// Google OAuth token endpoint
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, redirectUri } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    // For development, simulate successful OAuth (in production, you'd need the actual client secret)
    // Exchange authorization code for tokens
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }
    
    // Exchange authorization code for tokens
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }
    
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', error)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      )
    }

    const tokens = await tokenResponse.json()

    // Get user info using the access token
    const userResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const error = await userResponse.text()
      console.error('Failed to get user info:', error)
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 400 }
      )
    }

    const googleUser = await userResponse.json()
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    try {
      // Create consistent user ID using Google ID
      const userId = `google-${googleUser.id}`
      
      // Check if user exists in our database
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      let user;
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create new user
        console.log('Creating new Google user:', googleUser.email)
        
        // Create auth user first
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: googleUser.email,
          email_confirm: true,
          user_metadata: {
            full_name: googleUser.name,
            picture: googleUser.picture,
            provider: 'google',
            provider_id: googleUser.id
          }
        })

        if (authError) {
          console.error('Error creating auth user:', authError)
          // If user already exists in auth, try to get them
          const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserById(userId)
          if (!existingAuthUser.user) {
            return NextResponse.json(
              { error: 'Failed to create user account' },
              { status: 500 }
            )
          }
        }

        // Create user profile in our database
        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: googleUser.email,
            full_name: googleUser.name,
            avatar_url: googleUser.picture,
            provider: 'google',
            provider_id: googleUser.id,
            email_verified: true,
            last_login_at: new Date().toISOString()
          })
          .select()
          .single()

        if (userError) {
          console.error('Error creating user profile:', userError)
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          )
        }

        // Set up 7-day free trial
        const { data: freePlan } = await supabaseAdmin
          .from('subscription_plans')
          .select('id')
          .eq('name', 'Free Trial')
          .single()

        if (freePlan) {
          const trialStartDate = new Date()
          const trialEndDate = new Date()
          trialEndDate.setDate(trialEndDate.getDate() + 7)

          await supabaseAdmin
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              plan_id: freePlan.id,
              status: 'trial',
              trial_start_date: trialStartDate.toISOString(),
              trial_end_date: trialEndDate.toISOString(),
              current_period_start: trialStartDate.toISOString(),
              current_period_end: trialEndDate.toISOString(),
              cancel_at_period_end: false,
            })
        }

        user = newUser
      } else if (fetchError) {
        console.error('Error fetching user:', fetchError)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      } else {
        // User exists, update last login
        console.log('Updating existing Google user:', googleUser.email)
        
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            last_login_at: new Date().toISOString(),
            avatar_url: googleUser.picture, // Update in case it changed
            full_name: googleUser.name // Update in case it changed
          })
          .eq('id', userId)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating user:', updateError)
          return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
          )
        }
        
        user = updatedUser
      }

      console.log(`Google OAuth processed for user: ${googleUser.email}`)

      // Return user data with Supabase user ID
      return NextResponse.json({
        user: {
          id: userId,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          verified_email: googleUser.verified_email,
          supabase_user: user
        },
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        },
      })
      
    } catch (dbError) {
      console.error('Database error during Google OAuth:', dbError)
      return NextResponse.json(
        { error: 'Failed to save user data' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}