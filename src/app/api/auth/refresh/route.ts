import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'

/**
 * POST /api/auth/refresh
 * Refresh the user's authentication session
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { refreshToken } = body
    
    if (!refreshToken) {
      return validationErrorResponse({ refreshToken: ['Refresh token is required'] })
    }
    
    // Refresh the session with Supabase
    const { data: authData, error: authError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })
    
    if (authError || !authData.session) {
      return unauthorizedResponse('Invalid or expired refresh token')
    }
    
    return successResponse({
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at,
        tokenType: authData.session.token_type,
      },
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        emailVerified: authData.user?.email_confirmed_at !== null,
      },
    }, 'Session refreshed successfully')
    
  } catch (error) {
    console.error('Token refresh error:', error)
    return errorResponse('Failed to refresh token', 500)
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