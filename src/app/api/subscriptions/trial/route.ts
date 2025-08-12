import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth-middleware'

/**
 * POST /api/subscriptions/trial
 * Start free trial for user - automatically starts 7-day trial with $5/week plan
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      // Check if user already has a subscription
      const { data: existingSubscription, error: existingError } = await supabase
        .from('user_subscriptions')
        .select('id, status, trial_end_date')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingError) {
        console.error('Error checking existing subscription:', existingError)
        return errorResponse('Failed to check subscription status', 500)
      }
      
      if (existingSubscription) {
        return errorResponse('User already has a subscription', 409)
      }

      // Get the simplified subscription plan
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'Interview Prep Access')
        .eq('is_active', true)
        .single()

      if (planError || !plan) {
        console.error('Error fetching subscription plan:', planError)
        return errorResponse('Subscription plan not found', 404)
      }

      // Create trial subscription
      const trialStartDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialStartDate.getDate() + 7) // 7-day trial

      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'trial',
          trial_start_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          current_period_start: trialStartDate.toISOString(),
          current_period_end: trialEndDate.toISOString(),
          cancel_at_period_end: false, // Will convert to paid after trial
        })
        .select(`
          *,
          subscription_plans (
            name,
            description,
            features,
            price_weekly,
            max_sessions_per_day,
            max_questions_per_session
          )
        `)
        .single()

      if (subscriptionError) {
        console.error('Error creating trial subscription:', subscriptionError)
        return errorResponse('Failed to create trial subscription', 500)
      }

      // Initialize prompt usage tracking for the user
      const { error: promptUsageError } = await supabase
        .from('prompt_usage')
        .insert({
          user_id: user.id,
          usage_date: new Date().toISOString().split('T')[0], // Today's date
          prompt_count: 0,
          prompt_limit: 20,
        })
        .select()
        .single()

      if (promptUsageError && promptUsageError.code !== '23505') { // Ignore unique constraint violation
        console.warn('Warning: Could not initialize prompt usage:', promptUsageError)
      }

      return successResponse(
        {
          ...subscription,
          promptUsage: {
            todayCount: 0,
            dailyLimit: 20,
            remainingPrompts: 20,
          },
        },
        'Free trial started successfully. You have 7 days of full access, then $5/week.',
        undefined,
        201
      )
      
    } catch (error) {
      console.error('Start trial error:', error)
      return errorResponse('Failed to start trial', 500)
    }
  })
)

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