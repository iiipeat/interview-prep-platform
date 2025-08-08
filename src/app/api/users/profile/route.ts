import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { 
  validateRequestBody, 
  userProfileCreationSchema,
  userProfileUpdateSchema 
} from '@/lib/validation'

// Helper function to get user from auth token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * GET /api/users/profile
 * Get current user's profile information
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code === 'PGRST116') {
      return notFoundResponse('User profile')
    }
    
    if (error) {
      return errorResponse('Failed to fetch profile', 500)
    }
    
    return successResponse(profile)
    
  } catch (error) {
    console.error('Get profile error:', error)
    return errorResponse('Failed to get profile', 500)
  }
})

/**
 * POST /api/users/profile
 * Create user profile (onboarding)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const body = await request.json()
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    userProfileCreationSchema,
    body
  )
  
  if (validationError) {
    return validationErrorResponse({ body: [validationError] })
  }
  
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (existingProfile) {
      return errorResponse('User profile already exists', 409)
    }
    
    // Create new profile
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: user.id,
        ...validatedData,
      })
      .select('*')
      .single()
    
    if (error) {
      return errorResponse('Failed to create profile', 500)
    }
    
    return successResponse(profile, 'Profile created successfully', undefined, 201)
    
  } catch (error) {
    console.error('Create profile error:', error)
    return errorResponse('Failed to create profile', 500)
  }
})

/**
 * PUT /api/users/profile
 * Update user profile
 */
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const body = await request.json()
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    userProfileUpdateSchema,
    body
  )
  
  if (validationError) {
    return validationErrorResponse({ body: [validationError] })
  }
  
  try {
    // Update profile
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select('*')
      .single()
    
    if (error && error.code === 'PGRST116') {
      return notFoundResponse('User profile')
    }
    
    if (error) {
      return errorResponse('Failed to update profile', 500)
    }
    
    return successResponse(profile, 'Profile updated successfully')
    
  } catch (error) {
    console.error('Update profile error:', error)
    return errorResponse('Failed to update profile', 500)
  }
})

/**
 * DELETE /api/users/profile
 * Delete user profile
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  try {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)
    
    if (error) {
      return errorResponse('Failed to delete profile', 500)
    }
    
    return successResponse(null, 'Profile deleted successfully')
    
  } catch (error) {
    console.error('Delete profile error:', error)
    return errorResponse('Failed to delete profile', 500)
  }
})

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}