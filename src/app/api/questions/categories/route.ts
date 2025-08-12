import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
} from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'

/**
 * GET /api/questions/categories
 * Get all question categories
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('question_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      return errorResponse('Failed to fetch question categories', 500)
    }
    
    return successResponse(categories)
    
  } catch (error) {
    console.error('Get question categories error:', error)
    return errorResponse('Failed to get question categories', 500)
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