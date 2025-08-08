/**
 * Stripe Client Implementation
 * Mock implementation for development - replace with actual Stripe integration
 */

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

class MockStripeClient {
  private mockDatabase: Map<string, any> = new Map();

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
  }): Promise<CheckoutSession> {
    // Mock implementation
    const sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const customerId = `cus_mock_${params.userId}`;
    
    const session: CheckoutSession = {
      id: sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}#fidkdWxuYHYxfHFgf...`,
      customerId,
    };

    // Store mock session for webhook simulation
    this.mockDatabase.set(sessionId, {
      ...session,
      email: params.email,
      priceId: params.priceId,
      userId: params.userId,
      trialPeriodDays: params.trialPeriodDays,
    });

    return session;
  }

  /**
   * Retrieve subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionDetails | null> {
    // Mock implementation
    const mockSubscription = this.mockDatabase.get(`sub_${subscriptionId}`);
    if (!mockSubscription) return null;

    return mockSubscription;
  }

  /**
   * Create or retrieve customer
   */
  async createCustomer(params: {
    email: string;
    userId: string;
    name?: string;
  }): Promise<Customer> {
    const customerId = `cus_mock_${params.userId}`;
    
    const customer: Customer = {
      id: customerId,
      email: params.email,
      subscriptions: [],
    };

    this.mockDatabase.set(customerId, customer);
    return customer;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<SubscriptionDetails> {
    const subscription = this.mockDatabase.get(`sub_${subscriptionId}`);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const updatedSubscription = {
      ...subscription,
      cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? subscription.status : 'canceled' as const,
    };

    this.mockDatabase.set(`sub_${subscriptionId}`, updatedSubscription);
    return updatedSubscription;
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: string, params: {
    priceId?: string;
    trialEnd?: Date;
  }): Promise<SubscriptionDetails> {
    const subscription = this.mockDatabase.get(`sub_${subscriptionId}`);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const updatedSubscription = {
      ...subscription,
      ...params,
    };

    this.mockDatabase.set(`sub_${subscriptionId}`, updatedSubscription);
    return updatedSubscription;
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    return {
      url: `https://billing.stripe.com/p/session/mock_${customerId}?return_url=${encodeURIComponent(returnUrl)}`
    };
  }

  /**
   * Simulate webhook event (for development)
   */
  simulateWebhookEvent(type: string, data: any): any {
    return {
      id: `evt_mock_${Date.now()}`,
      type,
      data: {
        object: data,
      },
      created: Math.floor(Date.now() / 1000),
    };
  }
}

// Singleton instance
let stripeClient: MockStripeClient;

export const getStripeClient = (): MockStripeClient => {
  if (!stripeClient) {
    stripeClient = new MockStripeClient();
  }
  return stripeClient;
};

export const stripe = getStripeClient();