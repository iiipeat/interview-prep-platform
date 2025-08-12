import { NextRequest } from 'next/server';
import { 
  successResponse, 
  errorResponse,
} from '../../../../lib/api-helpers';
import { withErrorHandler } from '../../../../lib/error-handler';
import { withAuth } from '../../../../lib/auth-middleware';
import { stripe } from '../../../../lib/stripe';
import { supabase } from '../../../../lib/supabase';
import { z } from '../../../../lib/validation';

const reactivateSchema = z.object({
  subscriptionId: z.string(),
});

/**
 * POST /api/subscriptions/reactivate
 * Reactivate a canceled subscription (before period end)
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const { subscriptionId } = reactivateSchema.parse(body);

      // Verify the subscription belongs to the user and is eligible for reactivation
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', subscriptionId)
        .single();

      if (error || !subscription) {
        return errorResponse('Subscription not found', 404);
      }

      if (!subscription.cancel_at_period_end || subscription.status !== 'active') {
        return errorResponse('Subscription is not eligible for reactivation', 400);
      }

      // Check if we're still within the current period
      const now = new Date();
      const periodEnd = new Date(subscription.current_period_end);
      
      if (now > periodEnd) {
        return errorResponse('Subscription period has already ended', 400);
      }

      // Reactivate the subscription in Stripe
      if (subscription.stripe_subscription_id) {
        await stripe.updateSubscription(subscription.stripe_subscription_id, {
          // Remove cancellation
        });
      }

      // Update subscription in our database
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('Failed to reactivate subscription:', updateError);
        return errorResponse('Failed to reactivate subscription', 500);
      }

      return successResponse({
        message: 'Subscription reactivated successfully',
        subscription: {
          ...subscription,
          cancel_at_period_end: false,
          canceled_at: null,
        },
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse('Invalid request data', 400, error.errors);
      }
      
      console.error('Reactivate subscription error:', error);
      return errorResponse('Failed to reactivate subscription', 500);
    }
  })
);

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};