import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse,
  notFoundResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { validateUUID } from '@/lib/api-helpers'

/**
 * GET /api/questions/[id]
 * Get a specific question by ID
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = params
  
  // Validate UUID format
  if (!validateUUID(id)) {
    return errorResponse('Invalid question ID format', 400)
  }
  
  try {
    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .select(`
        *,
        question_categories (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code === 'PGRST116') {
      return notFoundResponse('Question')
    }
    
    if (error) {
      return errorResponse('Failed to fetch question', 500)
    }
    
    // Increment usage count
    await supabaseAdmin.rpc('increment_question_usage', { question_uuid: id })
    
    return successResponse(question)
    
  } catch (error) {
    console.error('Get question error:', error)
    return errorResponse('Failed to get question', 500)
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