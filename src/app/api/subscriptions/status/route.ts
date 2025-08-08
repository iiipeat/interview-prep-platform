import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth-middleware'
import { stripeConfig, formatPrice } from '@/lib/stripe'

/**
 * GET /api/subscriptions/status
 * Get current user's subscription status
 */
export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      // Get user's current subscription
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            description,
            price_monthly,
            price_weekly,
            features,
            max_sessions_per_day,
            max_questions_per_session
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['trial', 'active', 'past_due', 'canceled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Subscription status query error:', error);
        return errorResponse('Failed to get subscription status', 500);
      }

      if (!subscription) {
        // No subscription found
        return successResponse({
          hasSubscription: false,
          subscription: null,
        });
      }

      // Format subscription data for frontend
      const plan = subscription.subscription_plans;
      const isWeekly = plan?.price_weekly && !plan?.price_monthly;
      const priceAmount = isWeekly ? plan.price_weekly : plan.price_monthly;
      const pricePeriod = isWeekly ? 'week' : 'month';

      const subscriptionData = {
        id: subscription.id,
        planName: plan?.name || 'Unknown Plan',
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        trialEndDate: subscription.trial_end_date,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        priceAmount: priceAmount || 0,
        pricePeriod,
        features: plan?.features || {},
        maxSessionsPerDay: plan?.max_sessions_per_day || 0,
        maxQuestionsPerSession: plan?.max_questions_per_session || 0,
      };

      return successResponse({
        hasSubscription: true,
        subscription: subscriptionData,
        // Legacy fields for backward compatibility
        isSubscribed: ['trial', 'active'].includes(subscription.status),
        planName: plan?.name || 'Unknown Plan',
        status: subscription.status,
        trialEndsAt: subscription.trial_end_date,
        periodEndsAt: subscription.current_period_end,
      });

    } catch (error) {
      console.error('Get subscription status error:', error);
      return errorResponse('Failed to get subscription status', 500);
    }
  })
);

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