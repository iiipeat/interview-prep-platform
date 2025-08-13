import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  validateUUID,
} from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'
import { validateRequestBody, sessionCompletionSchema } from '../../../../lib/validation'

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
 * GET /api/sessions/[id]
 * Get a specific practice session with responses
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const { id } = params
  
  // Validate UUID format
  if (!validateUUID(id)) {
    return errorResponse('Invalid session ID format', 400)
  }
  
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
    }
    // Get session with responses
    const { data: session, error } = await supabaseAdmin
      .from('practice_sessions')
      .select(`
        *,
        user_responses (
          id,
          question_id,
          response_text,
          ai_score,
          ai_feedback,
          strengths,
          improvements,
          question_rating,
          response_time_seconds,
          created_at,
          questions (
            id,
            title,
            question_text,
            difficulty,
            question_type
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code === 'PGRST116') {
      return notFoundResponse('Session')
    }
    
    if (error) {
      return errorResponse('Failed to fetch session', 500)
    }
    
    return successResponse(session)
    
  } catch (error) {
    console.error('Get session error:', error)
    return errorResponse('Failed to get session', 500)
  }
})

/**
 * PUT /api/sessions/[id]
 * Update session (complete, abandon, etc.)
 */
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const { id } = params
  const body = await request.json()
  
  // Validate UUID format
  if (!validateUUID(id)) {
    return errorResponse('Invalid session ID format', 400)
  }
  
  // Validate request body for completion
  const { data: validatedData, error: validationError } = validateRequestBody(
    sessionCompletionSchema.omit({ sessionId: true }),
    body
  )
  
  if (validationError) {
    return validationErrorResponse({ body: [validationError] })
  }
  
  try {
    // Verify session belongs to user
    const { data: existingSession, error: checkError } = await supabaseAdmin
      .from('practice_sessions')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (checkError && checkError.code === 'PGRST116') {
      return notFoundResponse('Session')
    }
    
    if (checkError) {
      return errorResponse('Failed to verify session', 500)
    }
    
    if (existingSession.status === 'completed') {
      return errorResponse('Session is already completed', 400)
    }
    
    // Update session
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    
    if (body.status) {
      updateData.status = body.status
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
    }
    
    if (validatedData.overallScore !== undefined) {
      updateData.overall_score = validatedData.overallScore
    }
    
    if (validatedData.feedbackSummary !== undefined) {
      updateData.feedback_summary = validatedData.feedbackSummary
    }
    
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('practice_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()
    
    if (updateError) {
      return errorResponse('Failed to update session', 500)
    }
    
    return successResponse(updatedSession, 'Session updated successfully')
    
  } catch (error) {
    console.error('Update session error:', error)
    return errorResponse('Failed to update session', 500)
  }
})

/**
 * DELETE /api/sessions/[id]
 * Delete a practice session
 */
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const { id } = params
  
  // Validate UUID format
  if (!validateUUID(id)) {
    return errorResponse('Invalid session ID format', 400)
  }
  
  try {
    // Delete session (cascades to user_responses)
    const { error } = await supabaseAdmin
      .from('practice_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
      return errorResponse('Failed to delete session', 500)
    }
    
    return successResponse(null, 'Session deleted successfully')
    
  } catch (error) {
    console.error('Delete session error:', error)
    return errorResponse('Failed to delete session', 500)
  }
})

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}