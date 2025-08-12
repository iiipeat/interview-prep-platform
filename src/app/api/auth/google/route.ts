import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsSync } from '@/lib/google-sheets-sync'

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

    // Sync user to Google Sheets
    const userData = {
      id: `google-${googleUser.id}`,  // Create consistent ID using Google ID
      email: googleUser.email,
      full_name: googleUser.name,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      user_subscriptions: [{
        status: 'trial',
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_plans: {
          name: 'Free Trial',
          price_weekly: 0,
          price_monthly: 0
        }
      }],
      prompt_usage: [{
        prompt_count: 0,
        prompt_limit: 20,
        usage_date: new Date().toISOString().split('T')[0]
      }],
      practice_sessions: []
    }

    // Sync to Google Sheets in background
    googleSheetsSync.syncUser(`google-${googleUser.id}`, userData).catch(err => {
      console.error('Failed to sync Google OAuth user to Sheets:', err)
    })

    console.log(`Google OAuth login synced for user: ${googleUser.email}`)

    // Return user data
    return NextResponse.json({
      user: {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        verified_email: googleUser.verified_email,
      },
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}