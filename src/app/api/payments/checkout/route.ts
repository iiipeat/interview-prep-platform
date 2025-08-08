import { NextRequest } from 'next/server';
import { 
  successResponse, 
  errorResponse,
} from '@/lib/api-helpers';
import { withErrorHandler } from '@/lib/error-handler';
import { withAuth } from '@/lib/auth-middleware';
import { stripe, stripeConfig } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { z } from '@/lib/validation';

const checkoutSchema = z.object({
  planId: z.enum(['weekly', 'monthly']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * POST /api/payments/checkout
 * Create a checkout session for subscription
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const { planId, successUrl, cancelUrl } = checkoutSchema.parse(body);

      // Get the plan configuration
      const plan = stripeConfig.plans[planId];
      if (!plan) {
        return errorResponse('Invalid plan selected', 400);
      }

      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['trial', 'active'])
        .single();

      if (existingSubscription) {
        return errorResponse('User already has an active subscription', 409);
      }

      // Create or get customer
      const customer = await stripe.createCustomer({
        email: user.email!,
        userId: user.id,
        name: user.user_metadata?.full_name || user.email!.split('@')[0],
      });

      // Create checkout session
      const session = await stripe.createCheckoutSession({
        userId: user.id,
        email: user.email!,
        priceId: plan.priceId,
        successUrl,
        cancelUrl,
        trialPeriodDays: 7, // 7-day free trial
      });

      // For mock implementation, we'll simulate the subscription creation
      // In production, this would be handled by the webhook after successful payment
      if (process.env.NODE_ENV === 'development') {
        // Create a mock subscription record
        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: planId === 'weekly' ? 'weekly_premium' : 'monthly_premium',
            status: 'trial',
            stripe_customer_id: customer.id,
            stripe_subscription_id: `sub_mock_${Date.now()}`,
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (planId === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (subscriptionError) {
          console.error('Failed to create mock subscription:', subscriptionError);
        }
      }

      return successResponse({
        sessionId: session.id,
        url: session.url,
        customerId: session.customerId,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse('Invalid request data', 400, error.errors);
      }
      
      console.error('Checkout error:', error);
      return errorResponse('Failed to create checkout session', 500);
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