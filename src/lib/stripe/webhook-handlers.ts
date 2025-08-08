/**
 * Stripe Webhook Event Handlers
 * Mock implementation for development
 */

import { supabase } from '../supabase';

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export class WebhookHandler {
  /**
   * Handle checkout session completed
   */
  async handleCheckoutSessionCompleted(event: WebhookEvent): Promise<void> {
    const session = event.data.object;
    
    try {
      // Extract user ID from metadata or customer email
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.customer_details?.email)
        .single();

      if (!user) {
        console.error('User not found for checkout session:', session.customer_details?.email);
        return;
      }

      // Create or update subscription
      const subscriptionData = {
        user_id: user.id,
        plan_id: this.getPlanIdFromPriceId(session.price_id),
        status: 'active',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        current_period_start: new Date(session.current_period_start * 1000).toISOString(),
        current_period_end: new Date(session.current_period_end * 1000).toISOString(),
        trial_start_date: session.trial_start ? new Date(session.trial_start * 1000).toISOString() : null,
        trial_end_date: session.trial_end ? new Date(session.trial_end * 1000).toISOString() : null,
      };

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id,plan_id',
        });

      if (error) {
        console.error('Failed to create subscription:', error);
        throw error;
      }

      console.log('Checkout session completed successfully for user:', user.id);
    } catch (error) {
      console.error('Error handling checkout session completed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
    const subscription = event.data.object;
    
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Failed to update subscription:', error);
        throw error;
      }

      console.log('Subscription updated successfully:', subscription.id);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(event: WebhookEvent): Promise<void> {
    const subscription = event.data.object;
    
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Failed to cancel subscription:', error);
        throw error;
      }

      console.log('Subscription canceled successfully:', subscription.id);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  /**
   * Handle invoice payment failed
   */
  async handleInvoicePaymentFailed(event: WebhookEvent): Promise<void> {
    const invoice = event.data.object;
    
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription);

      if (error) {
        console.error('Failed to update subscription status to past_due:', error);
        throw error;
      }

      console.log('Subscription marked as past_due:', invoice.subscription);
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
      throw error;
    }
  }

  /**
   * Handle invoice payment succeeded
   */
  async handleInvoicePaymentSucceeded(event: WebhookEvent): Promise<void> {
    const invoice = event.data.object;
    
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription);

      if (error) {
        console.error('Failed to update subscription status to active:', error);
        throw error;
      }

      console.log('Subscription reactivated:', invoice.subscription);
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Get plan ID from Stripe price ID
   */
  private getPlanIdFromPriceId(priceId: string): string {
    // Mock implementation - in production, maintain a mapping
    if (priceId.includes('weekly')) {
      return 'weekly_premium';
    } else if (priceId.includes('monthly')) {
      return 'monthly_premium';
    }
    return 'weekly_premium'; // default
  }
}

/**
 * Process webhook event based on type
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  const handler = new WebhookHandler();

  switch (event.type) {
    case 'checkout.session.completed':
      await handler.handleCheckoutSessionCompleted(event);
      break;
    
    case 'customer.subscription.updated':
      await handler.handleSubscriptionUpdated(event);
      break;
    
    case 'customer.subscription.deleted':
      await handler.handleSubscriptionDeleted(event);
      break;
    
    case 'invoice.payment_failed':
      await handler.handleInvoicePaymentFailed(event);
      break;
    
    case 'invoice.payment_succeeded':
      await handler.handleInvoicePaymentSucceeded(event);
      break;
    
    default:
      console.log('Unhandled webhook event type:', event.type);
  }
}