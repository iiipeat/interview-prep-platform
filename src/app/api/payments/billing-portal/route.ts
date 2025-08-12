import { NextRequest } from 'next/server';
import { 
  successResponse, 
  errorResponse,
} from '../../../../lib/api-helpers';
import { withErrorHandler } from '../../../../lib/error-handler';
import { withAuth } from '../../../../lib/auth-middleware';
import { stripe } from '../../../../lib/stripe';
import { supabase } from '../../../../lib/supabase';

/**
 * POST /api/payments/billing-portal
 * Create a billing portal session for customer to manage their subscription
 */
export const POST = withErrorHandler(
  withAuth(async (request: NextRequest, { user }) => {
    try {
      // Get user's subscription to find customer ID
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .in('status', ['trial', 'active', 'past_due'])
        .single();

      if (error || !subscription?.stripe_customer_id) {
        return errorResponse('No active subscription found', 404);
      }

      // Create billing portal session
      const returnUrl = `${request.headers.get('origin') || 'http://localhost:3000'}/dashboard`;
      
      const session = await stripe.createBillingPortalSession(
        subscription.stripe_customer_id,
        returnUrl
      );

      return successResponse({
        url: session.url,
      });

    } catch (error) {
      console.error('Billing portal error:', error);
      return errorResponse('Failed to create billing portal session', 500);
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