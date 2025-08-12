/**
 * Stripe Client Implementation
 * Production-ready Stripe integration
 */

import Stripe from 'stripe';
import { stripeConfig } from './config';

export interface CheckoutSession {
  id: string;
  url: string;
  customerId: string;
  subscriptionId?: string;
}

export interface SubscriptionDetails {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  priceId: string;
  customerId: string;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Customer {
  id: string;
  email: string;
  subscriptions: SubscriptionDetails[];
}

class StripeClient {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(params: {
    userId: string;
    email: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialPeriodDays?: number;
    planType?: 'weekly' | 'monthly';
  }): Promise<CheckoutSession> {
    try {
      // Create or retrieve customer
      const customer = await this.createOrRetrieveCustomer({
        email: params.email,
        userId: params.userId,
      });

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: {
          trial_period_days: params.trialPeriodDays,
          metadata: {
            userId: params.userId,
            planType: params.planType || 'weekly',
          },
        },
        metadata: {
          userId: params.userId,
        },
      });

      return {
        id: session.id,
        url: session.url || '',
        customerId: customer.id,
        subscriptionId: session.subscription as string | undefined,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Retrieve subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionDetails | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      return {
        id: subscription.id,
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        priceId: subscription.items.data[0]?.price.id || '',
        customerId: subscription.customer as string,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  }

  /**
   * Create or retrieve customer
   */
  async createOrRetrieveCustomer(params: {
    email: string;
    userId: string;
    name?: string;
  }): Promise<Customer> {
    try {
      // Check if customer already exists
      const existingCustomers = await this.stripe.customers.list({
        email: params.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        return {
          id: customer.id,
          email: customer.email || params.email,
          subscriptions: [],
        };
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          userId: params.userId,
        },
      });

      return {
        id: customer.id,
        email: customer.email || params.email,
        subscriptions: [],
      };
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<SubscriptionDetails> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      // If immediate cancellation requested
      if (!cancelAtPeriodEnd) {
        await this.stripe.subscriptions.cancel(subscriptionId);
      }

      return {
        id: subscription.id,
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        priceId: subscription.items.data[0]?.price.id || '',
        customerId: subscription.customer as string,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription (e.g., upgrade/downgrade plan)
   */
  async updateSubscription(subscriptionId: string, params: {
    priceId?: string;
    trialEnd?: Date;
  }): Promise<SubscriptionDetails> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};
      
      if (params.priceId) {
        // Get current subscription to replace items
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        updateParams.items = [
          {
            id: subscription.items.data[0].id,
            price: params.priceId,
          },
        ];
      }
      
      if (params.trialEnd) {
        updateParams.trial_end = Math.floor(params.trialEnd.getTime() / 1000);
      }

      const updatedSubscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updateParams
      );

      return {
        id: updatedSubscription.id,
        status: updatedSubscription.status as any,
        currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        priceId: updatedSubscription.items.data[0]?.price.id || '',
        customerId: updatedSubscription.customer as string,
        trialEnd: updatedSubscription.trial_end ? new Date(updatedSubscription.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return {
        url: session.url,
      };
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  /**
   * Get customer's subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
      });
      return subscriptions.data;
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error);
      return [];
    }
  }
}

// Singleton instance
let stripeClient: StripeClient;

export const getStripeClient = (): StripeClient => {
  if (!stripeClient) {
    stripeClient = new StripeClient();
  }
  return stripeClient;
};

export const stripe = getStripeClient();

// Export Stripe type for use in other modules
export { Stripe };