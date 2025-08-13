import { NextRequest } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { successResponse, errorResponse } from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'

/**
 * POST /api/auth/signout
 * Sign out the current user
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    if (!supabase) {
      return errorResponse('Database connection error', 500)
    }
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return errorResponse(error.message, 400)
    }
    
    return successResponse(
      null,
      'Signed out successfully'
    )
    
  } catch (error) {
    console.error('Signout error:', error)
    return errorResponse('Sign out failed', 500)
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