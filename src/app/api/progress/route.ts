import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
  parsePaginationParams,
  calculatePagination,
} from '../../../lib/api-helpers'
import { withErrorHandler } from '../../../lib/error-handler'

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
 * GET /api/progress
 * Get user's progress metrics with filtering and pagination
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = parsePaginationParams(searchParams)
  
  // Parse query parameters
  const metricName = searchParams.get('metric_name')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const days = searchParams.get('days') // Get last N days
  
  try {
    // Build query
    let query = supabaseAdmin
      .from('user_progress')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
    
    // Apply filters
    if (metricName) {
      query = query.eq('metric_name', metricName)
    }
    
    if (startDate) {
      query = query.gte('date_recorded', startDate)
    }
    
    if (endDate) {
      query = query.lte('date_recorded', endDate)
    }
    
    if (days) {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - parseInt(days))
      query = query.gte('date_recorded', daysAgo.toISOString().split('T')[0])
    }
    
    // Apply sorting and pagination
    query = query
      .order('date_recorded', { ascending: false })
      .order('metric_name', { ascending: true })
      .range(offset, offset + limit - 1)
    
    const { data: progressMetrics, error, count } = await query
    
    if (error) {
      return errorResponse('Failed to fetch progress metrics', 500)
    }
    
    const pagination = calculatePagination(page, limit, count || 0)
    
    return successResponse(progressMetrics, undefined, pagination)
    
  } catch (error) {
    console.error('Get progress error:', error)
    return errorResponse('Failed to get progress metrics', 500)
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