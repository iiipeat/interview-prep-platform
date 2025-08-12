import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  parsePaginationParams,
  calculatePagination,
} from '../../../lib/api-helpers'
import { withErrorHandler } from '../../../lib/error-handler'
import { validateRequestBody, sessionCreationSchema } from '../../../lib/validation'

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
 * GET /api/sessions
 * Get user's practice sessions with pagination
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = parsePaginationParams(searchParams)
  const status = searchParams.get('status')
  
  try {
    // Build query
    let query = supabaseAdmin
      .from('practice_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
    
    // Filter by status if provided
    if (status && ['in_progress', 'completed', 'abandoned'].includes(status)) {
      query = query.eq('status', status)
    }
    
    // Apply sorting and pagination
    query = query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: sessions, error, count } = await query
    
    if (error) {
      return errorResponse('Failed to fetch sessions', 500)
    }
    
    const pagination = calculatePagination(page, limit, count || 0)
    
    return successResponse(sessions, undefined, pagination)
    
  } catch (error) {
    console.error('Get sessions error:', error)
    return errorResponse('Failed to get sessions', 500)
  }
})

/**
 * POST /api/sessions
 * Create a new practice session
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const body = await request.json()
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    sessionCreationSchema,
    body
  )
  
  if (validationError) {
    return validationErrorResponse({ body: [validationError] })
  }
  
  try {
    // Check subscription limits
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        status,
        subscription_plans (
          max_sessions_per_day
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['trial', 'active'])
      .single()
    
    if (!subscription) {
      return errorResponse('Subscription required for practice sessions', 403)
    }
    
    // Check daily session limit
    const today = new Date().toISOString().split('T')[0]
    const { count: todaySessions } = await supabaseAdmin
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00.000Z`)
      .lt('started_at', `${today}T23:59:59.999Z`)
    
    const maxSessions = subscription.subscription_plans.max_sessions_per_day
    if (maxSessions && todaySessions && todaySessions >= maxSessions) {
      return errorResponse(`Daily session limit of ${maxSessions} reached`, 429)
    }
    
    // Create session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        session_type: validatedData.sessionType,
        target_role: validatedData.targetRole,
        difficulty: validatedData.difficulty,
        duration_minutes: validatedData.durationMinutes,
        status: 'in_progress',
        total_questions: validatedData.questionCount || 5,
        questions_answered: 0,
        started_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    
    if (sessionError) {
      return errorResponse('Failed to create session', 500)
    }
    
    return successResponse(session, 'Session created successfully', undefined, 201)
    
  } catch (error) {
    console.error('Create session error:', error)
    return errorResponse('Failed to create session', 500)
  }
})

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}