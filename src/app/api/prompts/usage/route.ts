import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth-middleware'

/**
 * GET /api/prompts/usage
 * Get current user's prompt usage for today
 */
export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get user's prompt usage for today using the database function
      const { data: usageData, error } = await supabase
        .rpc('get_daily_prompt_usage', { 
          user_uuid: user.id,
          check_date: today 
        })
        .single();

      if (error) {
        console.error('Error getting prompt usage:', error);
        return errorResponse('Failed to get prompt usage', 500);
      }

      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0); // Next midnight

      return successResponse({
        todayCount: usageData.current_usage || 0,
        dailyLimit: usageData.daily_limit || 20,
        remainingPrompts: usageData.remaining_prompts || 20,
        canMakePrompt: usageData.can_make_prompt || true,
        resetTime: resetTime.toISOString(),
        date: today,
      });

    } catch (error) {
      console.error('Get prompt usage error:', error);
      return errorResponse('Failed to get prompt usage', 500);
    }
  })
);

/**
 * POST /api/prompts/usage
 * Track a new prompt usage - increments the daily count
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status, trial_end_date, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['trial', 'active'])
        .maybeSingle();

      if (!subscription) {
        return errorResponse('No active subscription found', 403);
      }

      // Check if subscription is currently active
      const now = new Date();
      const isInTrial = subscription.status === 'trial' && 
                      subscription.trial_end_date && 
                      new Date(subscription.trial_end_date) > now;
      
      const isActive = subscription.status === 'active' && 
                      subscription.current_period_end && 
                      new Date(subscription.current_period_end) > now;

      if (!isInTrial && !isActive) {
        return errorResponse('Subscription has expired', 403);
      }

      // Attempt to increment usage using the database function
      const { data: canIncrement, error } = await supabase
        .rpc('increment_prompt_usage', { 
          user_uuid: user.id,
          usage_date: today 
        })
        .single();

      if (error) {
        console.error('Error incrementing prompt usage:', error);
        return errorResponse('Failed to track prompt usage', 500);
      }

      if (!canIncrement) {
        return errorResponse('Daily prompt limit exceeded', 429);
      }

      // Get updated usage stats
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_daily_prompt_usage', { 
          user_uuid: user.id,
          check_date: today 
        })
        .single();

      if (usageError) {
        console.warn('Could not get updated usage stats:', usageError);
        // Return success anyway since the increment worked
        return successResponse({
          success: true,
          message: 'Prompt usage tracked successfully',
        });
      }

      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0); // Next midnight

      return successResponse({
        success: true,
        message: 'Prompt usage tracked successfully',
        usage: {
          todayCount: usageData.current_usage || 0,
          dailyLimit: usageData.daily_limit || 20,
          remainingPrompts: usageData.remaining_prompts || 0,
          canMakePrompt: usageData.can_make_prompt || false,
          resetTime: resetTime.toISOString(),
          date: today,
        }
      });

    } catch (error) {
      console.error('Track prompt usage error:', error);
      return errorResponse('Failed to track prompt usage', 500);
    }
  })
);

/**
 * PUT /api/prompts/usage
 * Check if user can make a prompt without incrementing the counter
 */
export const PUT = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status, trial_end_date, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['trial', 'active'])
        .maybeSingle();

      if (!subscription) {
        return successResponse({
          canMakePrompt: false,
          reason: 'No active subscription',
          needsSubscription: true,
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

      if (!isInTrial && !isActive) {
        return successResponse({
          canMakePrompt: false,
          reason: 'Subscription has expired',
          needsSubscription: true,
        });
      }

      // Get current usage without incrementing
      const { data: usageData, error } = await supabase
        .rpc('get_daily_prompt_usage', { 
          user_uuid: user.id,
          check_date: today 
        })
        .single();

      if (error) {
        console.error('Error checking prompt usage:', error);
        return errorResponse('Failed to check prompt usage', 500);
      }

      const canMakePrompt = usageData.can_make_prompt || false;
      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0); // Next midnight

      return successResponse({
        canMakePrompt,
        reason: canMakePrompt ? 'Available' : 'Daily limit exceeded',
        usage: {
          todayCount: usageData.current_usage || 0,
          dailyLimit: usageData.daily_limit || 20,
          remainingPrompts: usageData.remaining_prompts || 0,
          resetTime: resetTime.toISOString(),
          date: today,
        }
      });

    } catch (error) {
      console.error('Check prompt usage error:', error);
      return errorResponse('Failed to check prompt usage', 500);
    }
  })
);

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};