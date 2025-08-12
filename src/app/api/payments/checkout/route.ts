import { NextRequest } from 'next/server';
import { 
  successResponse, 
  errorResponse,
} from '../../../../lib/api-helpers';
import { withErrorHandler } from '../../../../lib/error-handler';
import { withAuth } from '../../../../lib/auth-middleware';
import { stripe, getPlanById } from '../../../../lib/stripe';
import { supabase } from '../../../../lib/supabase';
import { z } from '../../../../lib/validation';

const checkoutSchema = z.object({
  planType: z.enum(['weekly', 'monthly']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * POST /api/payments/checkout
 * Create a checkout session for the weekly subscription (after trial ends)
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const { planType, successUrl, cancelUrl } = checkoutSchema.parse(body);

      // Get the selected plan configuration
      const plan = getPlanById(planType);
      if (!plan) {
        return errorResponse('Invalid plan type', 400);
      }

      // Build URLs with defaults if not provided
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const finalSuccessUrl = successUrl || `${baseUrl}/dashboard?payment=success&plan=${planType}`;
      const finalCancelUrl = cancelUrl || `${baseUrl}/pricing?payment=cancelled`;

      // Check current subscription status
      const { data: existingSubscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('Error checking subscription:', subError);
        return errorResponse('Failed to check subscription status', 500);
      }

      // Check if user has an active paid subscription (allow upgrades)
      const hasActiveSubscription = existingSubscription?.status === 'active' && 
          existingSubscription.current_period_end && 
          new Date(existingSubscription.current_period_end) > new Date();
      
      // Allow upgrade from weekly to monthly, but not duplicate subscriptions
      if (hasActiveSubscription && existingSubscription.stripe_subscription_id) {
        const currentPriceId = existingSubscription.stripe_price_id;
        if (currentPriceId === plan.priceId) {
          return errorResponse('User already has this subscription plan', 409);
        }
        // If upgrading, we'll handle it through Stripe's proration
      }

      // For real Stripe implementation
      const customerEmail = user.email || '';
      const customerName = user.user_metadata?.full_name || customerEmail.split('@')[0];

      // For users converting from trial, don't add another trial period
      const hasHadTrial = existingSubscription?.status === 'trial' || 
                         existingSubscription?.trial_end_date;

      // Create checkout session with real Stripe
      const session = await stripe.createCheckoutSession({
        userId: user.id,
        email: customerEmail,
        priceId: plan.priceId,
        successUrl: finalSuccessUrl,
        cancelUrl: finalCancelUrl,
        trialPeriodDays: hasHadTrial ? undefined : plan.trialDays,
        planType: planType,
      });

      // The actual subscription creation will be handled by webhook events
      // after successful payment completion

      return successResponse({
        sessionId: session.id,
        url: session.url,
        customerId: session.customerId,
        plan: {
          name: plan.name,
          price: plan.price,
          description: plan.description,
          interval: plan.interval,
        }
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