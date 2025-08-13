import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
} from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'

/**
 * GET /api/auth/me
 * Get current user information
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
    }
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse('Authorization token required')
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired token')
    }
    
    // Get user profile with extended information
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_profiles (*),
        user_subscriptions!inner (
          id,
          status,
          trial_end_date,
          current_period_end,
          subscription_plans (
            name,
            features,
            max_sessions_per_day,
            max_questions_per_session
          )
        )
      `)
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Failed to fetch user profile:', profileError)
      // Return basic user info if profile fetch fails
      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
          emailVerified: user.email_confirmed_at !== null,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      })
    }
    
    return successResponse({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name,
        avatarUrl: userProfile.avatar_url,
        provider: userProfile.provider,
        isActive: userProfile.is_active,
        emailVerified: userProfile.email_verified,
        lastLoginAt: userProfile.last_login_at,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at,
        profile: userProfile.user_profiles,
        subscription: userProfile.user_subscriptions?.[0] || null,
      },
    })
    
  } catch (error) {
    console.error('Get user error:', error)
    return errorResponse('Failed to get user information', 500)
  }
})

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}