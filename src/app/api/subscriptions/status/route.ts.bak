import { NextRequest } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
} from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'
import { withAuth } from '../../../../lib/auth-middleware'
import { stripeConfig, formatPrice } from '../../../../lib/stripe'

/**
 * GET /api/subscriptions/status
 * Get current user's subscription status including prompt usage
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
        .maybeSingle();

      if (error) {
        console.error('Subscription status query error:', error);
        return errorResponse('Failed to get subscription status', 500);
      }

      // Get today's prompt usage
      const today = new Date().toISOString().split('T')[0];
      const { data: promptUsage, error: usageError } = await supabase
        .from('prompt_usage')
        .select('prompt_count, prompt_limit')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (usageError) {
        console.error('Prompt usage query error:', usageError);
      }

      // Initialize prompt usage if not found
      let currentUsage = 0;
      let dailyLimit = 20;
      
      if (promptUsage) {
        currentUsage = promptUsage.prompt_count || 0;
        dailyLimit = promptUsage.prompt_limit || 20;
      } else {
        // Create usage record for today if it doesn't exist
        await supabase
          .from('prompt_usage')
          .insert({
            user_id: user.id,
            usage_date: today,
            prompt_count: 0,
            prompt_limit: 20,
          })
          .select()
          .maybeSingle();
      }

      const promptUsageData = {
        todayCount: currentUsage,
        dailyLimit,
        remainingPrompts: Math.max(0, dailyLimit - currentUsage),
        canMakePrompt: currentUsage < dailyLimit,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(), // Next midnight
      };

      if (!subscription) {
        // No subscription found - user needs to start trial
        return successResponse({
          hasSubscription: false,
          subscription: null,
          promptUsage: promptUsageData,
          needsTrialSetup: true,
        });
      }

      // Check if subscription is currently active
      const now = new Date();
      const isInTrial = subscription.status === 'trial' && 
                      subscription.trial_end_date && 
                      new Date(subscription.trial_end_date) > now;
      
      const isActive = subscription.status === 'active' && 
                      subscription.current_period_end && 
                      new Date(subscription.current_period_end) > now;

      const hasActiveAccess = isInTrial || isActive;

      // Format subscription data for frontend
      const plan = subscription.subscription_plans;
      const priceAmount = plan?.price_weekly || 500; // Default to $5/week

      const subscriptionData = {
        id: subscription.id,
        planName: plan?.name || 'Interview Prep Access',
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        trialStartDate: subscription.trial_start_date,
        trialEndDate: subscription.trial_end_date,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        priceAmount,
        pricePeriod: 'week',
        features: plan?.features || {
          trial_period: 7,
          daily_prompt_limit: 20,
          ai_feedback: true,
          all_industries: true,
          progress_tracking: true,
          achievements: true,
          unlimited_sessions: true,
          advanced_analytics: true,
          voice_responses: true
        },
        maxSessionsPerDay: plan?.max_sessions_per_day || 999,
        maxQuestionsPerSession: plan?.max_questions_per_session || 20,
        isInTrial,
        hasActiveAccess,
        daysRemainingInTrial: isInTrial ? 
          Math.ceil((new Date(subscription.trial_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      };

      return successResponse({
        hasSubscription: true,
        subscription: subscriptionData,
        promptUsage: promptUsageData,
        // Legacy fields for backward compatibility
        isSubscribed: hasActiveAccess,
        planName: plan?.name || 'Interview Prep Access',
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