import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'

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
 * POST /api/subscriptions/trial
 * Start free trial for user
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  try {
    // Check if user already has a subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .single()
    
    if (existingSubscription) {
      return errorResponse('User already has a subscription', 409)
    }
    
    // Get the free trial plan
    const { data: trialPlan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('name', 'Free Trial')
      .single()
    
    if (planError || !trialPlan) {
      return errorResponse('Free trial plan not found', 404)
    }
    
    // Create trial subscription
    const trialStartDate = new Date()
    const trialEndDate = new Date()
    trialEndDate.setDate(trialStartDate.getDate() + 7) // 7-day trial
    
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: trialPlan.id,
        status: 'trial',
        trial_start_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        current_period_start: trialStartDate.toISOString(),
        current_period_end: trialEndDate.toISOString(),
        cancel_at_period_end: true, // Auto-cancel when trial ends
      })
      .select(`
        *,
        subscription_plans (
          name,
          description,
          features,
          max_sessions_per_day,
          max_questions_per_session
        )
      `)
      .single()
    
    if (subscriptionError) {
      return errorResponse('Failed to create trial subscription', 500)
    }
    
    return successResponse(
      subscription, 
      'Free trial started successfully', 
      undefined, 
      201
    )
    
  } catch (error) {
    console.error('Start trial error:', error)
    return errorResponse('Failed to start trial', 500)
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