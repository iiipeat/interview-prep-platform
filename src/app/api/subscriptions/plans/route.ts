import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
} from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
    }
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true, nullsFirst: true })
    
    if (error) {
      return errorResponse('Failed to fetch subscription plans', 500)
    }
    
    return successResponse(plans)
    
  } catch (error) {
    console.error('Get subscription plans error:', error)
    return errorResponse('Failed to get subscription plans', 500)
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