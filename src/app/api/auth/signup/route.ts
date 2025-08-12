import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { validateRequestBody, userRegistrationSchema } from '@/lib/validation'
import { googleSheetsSync } from '@/lib/google-sheets-sync'

/**
 * POST /api/auth/signup
 * Register a new user account
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    userRegistrationSchema,
    body
  )
  
  if (validationError) {
    return validationErrorResponse({ body: [validationError] })
  }
  
  const { email, password, fullName } = validatedData
  const profileData = body.profileData || {}
  
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: process.env.NODE_ENV === 'development', // Auto-confirm in development only
      user_metadata: {
        full_name: fullName,
        ...profileData
      }
    })
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        return errorResponse('User already exists with this email', 409)
      }
      return errorResponse(authError.message, 400)
    }
    
    if (!authData.user) {
      return errorResponse('Failed to create user', 500)
    }
    
    // Create user profile in our database
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: fullName,
        provider: 'email',
        email_verified: process.env.NODE_ENV === 'development',
      })
    
    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return errorResponse('Failed to create user profile', 500)
    }

    // Create user career profile if provided
    if (Object.keys(profileData).length > 0) {
      const { error: careerProfileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          current_role: profileData.current_role,
          target_role: profileData.target_role,
          experience_level: profileData.experience_level,
          industry: profileData.industry,
          preferred_difficulty: 'mixed', // Default
        })

      if (careerProfileError) {
        console.error('Failed to create career profile:', careerProfileError)
        // Don't fail the signup process if career profile creation fails
      }
    }

    // Set up 7-day free trial
    try {
      // Get the free trial plan
      const { data: freePlan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Free Trial')
        .single()

      if (planError) {
        console.error('Error finding free trial plan:', planError)
      } else if (freePlan) {
        const trialStartDate = new Date()
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 7) // 7 days from now

        const { error: subscriptionError } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: authData.user.id,
            plan_id: freePlan.id,
            status: 'trial',
            trial_start_date: trialStartDate.toISOString(),
            trial_end_date: trialEndDate.toISOString(),
            current_period_start: trialStartDate.toISOString(),
            current_period_end: trialEndDate.toISOString(),
            cancel_at_period_end: false,
          })

        if (subscriptionError) {
          console.error('Error creating trial subscription:', subscriptionError)
          // Don't fail the signup process if trial setup fails
        }
      }
    } catch (trialError) {
      console.error('Error setting up trial:', trialError)
      // Continue with signup even if trial setup fails
    }
    
    // Sync new user to Google Sheets in background
    googleSheetsSync.syncUser(authData.user.id, {
      id: authData.user.id,
      email: authData.user.email,
      full_name: fullName,
      created_at: authData.user.created_at,
      last_login_at: authData.user.created_at,
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
      practice_sessions: []
    }).catch(err => {
      console.error('Failed to sync new user to Google Sheets:', err)
    })
    
    return successResponse(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName,
          emailVerified: process.env.NODE_ENV === 'development',
          createdAt: authData.user.created_at,
        },
        trial: {
          enabled: true,
          durationDays: 7,
          message: '7-day free trial activated! Start exploring all features.',
        }
      },
      process.env.NODE_ENV === 'development' 
        ? 'Account created successfully. Welcome to your 7-day free trial!'
        : 'Account created! Please check your email to verify your address and activate your 7-day free trial.',
      undefined,
      201
    )
    
  } catch (error) {
    console.error('Signup error:', error)
    return errorResponse('Registration failed', 500)
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