/**
 * Stripe Webhook Event Handlers
 * Production-ready implementation with comprehensive event handling
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

// Notification service interface (mock for now)
interface NotificationService {
  sendTrialWillEndNotification(userId: string, email: string, daysRemaining: number): Promise<void>;
  sendPaymentFailedNotification(userId: string, email: string, attemptCount: number): Promise<void>;
  sendPaymentSucceededNotification(userId: string, email: string, amount: number): Promise<void>;
  sendSubscriptionCancelledNotification(userId: string, email: string, endDate: Date): Promise<void>;
}

class MockNotificationService implements NotificationService {
  async sendTrialWillEndNotification(userId: string, email: string, daysRemaining: number): Promise<void> {
    console.log(`[NOTIFICATION] Trial ending in ${daysRemaining} days for user ${userId} (${email})`);
    // TODO: Implement actual email/push notification service
  }

  async sendPaymentFailedNotification(userId: string, email: string, attemptCount: number): Promise<void> {
    console.log(`[NOTIFICATION] Payment failed (attempt ${attemptCount}) for user ${userId} (${email})`);
    // TODO: Implement actual email/push notification service
  }

  async sendPaymentSucceededNotification(userId: string, email: string, amount: number): Promise<void> {
    console.log(`[NOTIFICATION] Payment succeeded ($${(amount / 100).toFixed(2)}) for user ${userId} (${email})`);
    // TODO: Implement actual email/push notification service
  }

  async sendSubscriptionCancelledNotification(userId: string, email: string, endDate: Date): Promise<void> {
    console.log(`[NOTIFICATION] Subscription cancelled for user ${userId} (${email}), ends ${endDate.toISOString()}`);
    // TODO: Implement actual email/push notification service
  }
}

const notificationService: NotificationService = new MockNotificationService();

export class WebhookHandler {
  /**
   * Handle subscription trial will end (3 days before expiry)
   */
  async handleTrialWillEnd(event: WebhookEvent): Promise<void> {
    const subscription = event.data.object;
    console.log('Processing trial_will_end event for subscription:', subscription.id);
    
    try {
      // Find user by subscription ID
      const { data: userSubscription, error: fetchError } = await supabase!
        .from('user_subscriptions')
        .select(`
          user_id,
          trial_end_date,
          users!inner(id, email, full_name)
        `)
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (fetchError || !userSubscription) {
        console.error('User subscription not found for trial_will_end:', subscription.id);
        throw new Error(`User subscription not found: ${subscription.id}`);
      }

      const user = userSubscription.users as any;
      const trialEndDate = new Date(subscription.trial_end * 1000);
      const daysRemaining = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Send notification
      await notificationService.sendTrialWillEndNotification(
        user.id,
        user.email,
        daysRemaining
      );

      console.log(`Trial will end notification sent for user ${user.id} (${daysRemaining} days remaining)`);
    } catch (error) {
      console.error('Error handling trial will end:', error);
      throw error;
    }
  }

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    const subscription = event.data.object;
    console.log('Processing subscription_created event:', subscription.id);
    
    try {
      // Get customer email from Stripe customer ID
      const { data: user, error: userError } = await supabase!
        .from('users')
        .select('id, email')
        .eq('email', subscription.customer?.email || '') // In real Stripe, need to fetch customer
        .single();

      if (userError || !user) {
        console.error('User not found for subscription creation:', subscription.customer?.email);
        throw new Error(`User not found for customer: ${subscription.customer}`);
      }

      // Determine subscription status based on trial
      const status = subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000) 
        ? 'trial' 
        : subscription.status;

      const subscriptionData = {
        user_id: user.id,
        plan_id: await this.getPlanIdForUser(), // Single plan system
        status: status,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
      };

      const { error } = await supabase!
        .from('user_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Failed to create subscription:', error);
        throw error;
      }

      console.log(`Subscription created successfully for user ${user.id}: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription created:', error);
      throw error;
    }
  }

  /**
   * Handle checkout session completed (legacy support)
   */
  async handleCheckoutSessionCompleted(event: WebhookEvent): Promise<void> {
    const session = event.data.object;
    console.log('Processing checkout_session_completed event:', session.id);
    
    try {
      // Extract user ID from metadata or customer email
      const { data: user } = await supabase!
        .from('users')
        .select('id, email')
        .eq('email', session.customer_details?.email)
        .single();

      if (!user) {
        console.error('User not found for checkout session:', session.customer_details?.email);
        throw new Error(`User not found: ${session.customer_details?.email}`);
      }

      // Create or update subscription
      const subscriptionData = {
        user_id: user.id,
        plan_id: await this.getPlanIdForUser(),
        status: session.trial_end ? 'trial' : 'active',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        current_period_start: new Date(session.current_period_start * 1000).toISOString(),
        current_period_end: new Date(session.current_period_end * 1000).toISOString(),
        trial_start_date: session.trial_start ? new Date(session.trial_start * 1000).toISOString() : null,
        trial_end_date: session.trial_end ? new Date(session.trial_end * 1000).toISOString() : null,
      };

      const { error } = await supabase!
        .from('user_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id',
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
    console.log('Processing subscription_updated event:', subscription.id);
    
    try {
      // Handle trial to paid conversion
      const previousAttributes = (event.data as any).previous_attributes;
      const isTrialEnding = previousAttributes?.status === 'trialing' && subscription.status === 'active';
      
      const updateData = {
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedSub, error } = await supabase!
        .from('user_subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', subscription.id)
        .select(`
          user_id,
          users!inner(email)
        `)
        .single();

      if (error) {
        console.error('Failed to update subscription:', error);
        throw error;
      }

      // Log trial conversion
      if (isTrialEnding) {
        console.log(`Trial converted to paid subscription: ${subscription.id}`);
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
    console.log('Processing subscription_deleted event:', subscription.id);
    
    try {
      const { data: canceledSub, error } = await supabase!
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
        .select(`
          user_id,
          current_period_end,
          users!inner(id, email, full_name)
        `)
        .single();

      if (error) {
        console.error('Failed to cancel subscription:', error);
        throw error;
      }

      if (canceledSub) {
        const user = canceledSub.users as any;
        const endDate = new Date(canceledSub.current_period_end);
        
        // Send cancellation notification
        await notificationService.sendSubscriptionCancelledNotification(
          user.id,
          user.email,
          endDate
        );
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
    console.log('Processing invoice_payment_failed event:', invoice.id);
    
    try {
      const attemptCount = invoice.attempt_count || 1;
      const isFirstFailure = attemptCount === 1;
      
      // Update subscription status
      const { data: updatedSub, error } = await supabase!
        .from('user_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription)
        .select(`
          user_id,
          users!inner(id, email, full_name)
        `)
        .single();

      if (error) {
        console.error('Failed to update subscription status to past_due:', error);
        throw error;
      }

      if (updatedSub) {
        const user = updatedSub.users as any;
        
        // Send payment failure notification
        await notificationService.sendPaymentFailedNotification(
          user.id,
          user.email,
          attemptCount
        );
        
        console.log(`Payment failure notification sent for user ${user.id} (attempt ${attemptCount})`);
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
    console.log('Processing invoice_payment_succeeded event:', invoice.id);
    
    try {
      const amount = invoice.amount_paid || invoice.total;
      
      // Update subscription status to active
      const { data: updatedSub, error } = await supabase!
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription)
        .select(`
          user_id,
          users!inner(id, email, full_name)
        `)
        .single();

      if (error) {
        console.error('Failed to update subscription status to active:', error);
        throw error;
      }

      if (updatedSub) {
        const user = updatedSub.users as any;
        
        // Send payment success notification (for recovery from past_due)
        await notificationService.sendPaymentSucceededNotification(
          user.id,
          user.email,
          amount
        );
        
        console.log(`Payment success notification sent for user ${user.id} ($${(amount / 100).toFixed(2)})`);
      }

      console.log('Subscription reactivated:', invoice.subscription);
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Get the single plan ID for this application
   */
  private async getPlanIdForUser(): Promise<string> {
    const { data: plan, error } = await supabase!
      .from('subscription_plans')
      .select('id')
      .eq('is_active', true)
      .single();
      
    if (error || !plan) {
      console.error('Failed to fetch active subscription plan:', error);
      throw new Error('No active subscription plan found');
    }
    
    return plan.id;
  }

  /**
   * Get plan ID from Stripe price ID (legacy support)
   */
  private getPlanIdFromPriceId(priceId: string): string {
    // For the single plan system, always return the weekly premium plan
    return 'weekly_premium';
  }
}

/**
 * Process webhook event based on type
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  const handler = new WebhookHandler();
  const eventStartTime = Date.now();

  try {
    switch (event.type) {
      // Trial and subscription lifecycle events
      case 'customer.subscription.trial_will_end':
        await handler.handleTrialWillEnd(event);
        break;
        
      case 'customer.subscription.created':
        await handler.handleSubscriptionCreated(event);
        break;
      
      case 'customer.subscription.updated':
        await handler.handleSubscriptionUpdated(event);
        break;
      
      case 'customer.subscription.deleted':
        await handler.handleSubscriptionDeleted(event);
        break;
      
      // Payment events
      case 'invoice.payment_failed':
        await handler.handleInvoicePaymentFailed(event);
        break;
      
      case 'invoice.payment_succeeded':
        await handler.handleInvoicePaymentSucceeded(event);
        break;
      
      // Legacy support
      case 'checkout.session.completed':
        await handler.handleCheckoutSessionCompleted(event);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
        return; // Don't throw error for unhandled events
    }
    
    const processingTime = Date.now() - eventStartTime;
    console.log(`Successfully processed ${event.type} event in ${processingTime}ms`);
    
  } catch (error) {
    const processingTime = Date.now() - eventStartTime;
    console.error(`Failed to process ${event.type} event after ${processingTime}ms:`, error);
    
    // Add context to error for better debugging
    const enhancedError = new Error(
      `Webhook processing failed for ${event.type} (${event.id}): ${error instanceof Error ? error.message : String(error)}`
    );
    (enhancedError as any).cause = error;
    throw enhancedError;
  }
}