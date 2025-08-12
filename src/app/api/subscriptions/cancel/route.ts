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

const cancelSchema = z.object({
  subscriptionId: z.string(),
  cancelImmediately: z.boolean().optional().default(false),
});

/**
 * POST /api/subscriptions/cancel
 * Cancel user's subscription
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const { subscriptionId, cancelImmediately } = cancelSchema.parse(body);

      // Verify the subscription belongs to the user
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', subscriptionId)
        .single();

      if (error || !subscription) {
        return errorResponse('Subscription not found', 404);
      }

      if (!['trial', 'active'].includes(subscription.status)) {
        return errorResponse('Cannot cancel inactive subscription', 400);
      }

      // Cancel the subscription in Stripe
      if (subscription.stripe_subscription_id) {
        await stripe.cancelSubscription(
          subscription.stripe_subscription_id,
          !cancelImmediately // cancelAtPeriodEnd
        );
      }

      // Update subscription in our database
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: cancelImmediately ? 'canceled' : subscription.status,
          cancel_at_period_end: !cancelImmediately,
          canceled_at: cancelImmediately ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('Failed to update subscription:', updateError);
        return errorResponse('Failed to cancel subscription', 500);
      }

      return successResponse({
        message: cancelImmediately 
          ? 'Subscription canceled immediately' 
          : 'Subscription will be canceled at the end of the current period',
        canceledAt: cancelImmediately ? new Date().toISOString() : subscription.current_period_end,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse('Invalid request data', 400, error.errors);
      }
      
      console.error('Cancel subscription error:', error);
      return errorResponse('Failed to cancel subscription', 500);
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