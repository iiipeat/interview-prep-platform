import { NextRequest } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { validateRequestBody, userLoginSchema } from '@/lib/validation'
import { googleSheetsSync } from '@/lib/google-sheets-sync'

/**
 * POST /api/auth/signin
 * Sign in user with email and password
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    userLoginSchema,
    body
  )
  
  if (validationError) {
    return validationErrorResponse({ body: [validationError] })
  }
  
  const { email, password } = validatedData
  
  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (authError) {
      return errorResponse('Invalid email or password', 401)
    }
    
    if (!authData.user || !authData.session) {
      return errorResponse('Authentication failed', 401)
    }
    
    // Update last login timestamp and sync to Google Sheets
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id)
    
    // Sync user data to Google Sheets in background
    googleSheetsSync.updateUserLogin(authData.user.id, authData.user.email).catch(err => {
      console.error('Failed to sync login to Google Sheets:', err)
    })
    
    // Get user profile information
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_profiles (*)
      `)
      .eq('id', authData.user.id)
      .single()
    
    if (profileError || !userProfile) {
      console.error('Failed to fetch user profile:', profileError)
      // Continue with basic auth data even if profile fetch fails
    }
    
    return successResponse({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: userProfile?.full_name || null,
        avatarUrl: userProfile?.avatar_url || null,
        emailVerified: authData.user.email_confirmed_at !== null,
        lastLoginAt: new Date().toISOString(),
        profile: userProfile?.user_profiles || null,
      },
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at,
        tokenType: authData.session.token_type,
      },
    }, 'Signed in successfully')
    
  } catch (error) {
    console.error('Signin error:', error)
    return errorResponse('Sign in failed', 500)
  }
})

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}