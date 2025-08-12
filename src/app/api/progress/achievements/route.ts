import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
  parsePaginationParams,
  calculatePagination,
} from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'

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
 * GET /api/progress/achievements
 * Get user's achievements with pagination
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = parsePaginationParams(searchParams)
  
  try {
    const { data: achievements, error, count } = await supabaseAdmin
      .from('user_achievements')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      return errorResponse('Failed to fetch achievements', 500)
    }
    
    const pagination = calculatePagination(page, limit, count || 0)
    
    return successResponse(achievements, undefined, pagination)
    
  } catch (error) {
    console.error('Get achievements error:', error)
    return errorResponse('Failed to get achievements', 500)
  }
})

/**
 * POST /api/progress/achievements
 * Award achievement to user (internal use, triggered by system events)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const body = await request.json()
  const { achievementType, achievementName, description, iconName, metadata = {} } = body
  
  if (!achievementType) {
    return errorResponse('Achievement type is required', 400)
  }
  
  try {
    // Check if achievement already exists
    const { data: existingAchievement } = await supabaseAdmin
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_type', achievementType)
      .single()
    
    if (existingAchievement) {
      return errorResponse('Achievement already earned', 409)
    }
    
    // Award achievement
    const { data: achievement, error } = await supabaseAdmin
      .from('user_achievements')
      .insert({
        user_id: user.id,
        achievement_type: achievementType,
        achievement_name: achievementName,
        description,
        icon_name: iconName,
        metadata,
        earned_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    
    if (error) {
      return errorResponse('Failed to award achievement', 500)
    }
    
    return successResponse(achievement, 'Achievement awarded successfully', undefined, 201)
    
  } catch (error) {
    console.error('Award achievement error:', error)
    return errorResponse('Failed to award achievement', 500)
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