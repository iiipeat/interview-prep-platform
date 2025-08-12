import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  parsePaginationParams,
  calculatePagination,
  parseSortParams,
  parseFilterParams,
} from '../../../lib/api-helpers'
import { withErrorHandler } from '../../../lib/error-handler'
import { validateQueryParams, questionFilterSchema } from '../../../lib/validation'

/**
 * GET /api/questions
 * Get questions with filtering, sorting, and pagination
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  
  // Parse pagination params
  const { page, limit, offset } = parsePaginationParams(searchParams)
  
  // Parse sorting params
  const { sortBy, sortOrder } = parseSortParams(
    searchParams,
    ['title', 'difficulty', 'usage_count', 'rating', 'created_at'],
    'created_at'
  )
  
  // Parse and validate filters
  const { data: filters, error: filterError } = validateQueryParams(
    questionFilterSchema,
    searchParams
  )
  
  if (filterError) {
    return errorResponse(filterError, 400)
  }
  
  try {
    // Build query
    let query = supabaseAdmin
      .from('questions')
      .select(`
        *,
        question_categories (
          id,
          name
        )
      `, { count: 'exact' })
    
    // Apply filters
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    
    if (filters?.questionType) {
      query = query.eq('question_type', filters.questionType)
    }
    
    if (filters?.role) {
      query = query.ilike('role', `%${filters.role}%`)
    }
    
    if (filters?.experienceLevel) {
      query = query.eq('experience_level', filters.experienceLevel)
    }
    
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,question_text.ilike.%${filters.search}%`)
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data: questions, error, count } = await query
    
    if (error) {
      return errorResponse('Failed to fetch questions', 500)
    }
    
    const pagination = calculatePagination(page, limit, count || 0)
    
    return successResponse(questions, undefined, pagination)
    
  } catch (error) {
    console.error('Get questions error:', error)
    return errorResponse('Failed to get questions', 500)
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