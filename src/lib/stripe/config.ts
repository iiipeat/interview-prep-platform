/**
 * Stripe Configuration
 * Mock implementation for development
 * In production, replace with actual Stripe integration
 */

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  plans: {
    weekly: {
      id: string;
      priceId: string;
      price: number; // in cents
      name: string;
      description: string;
      features: string[];
    };
    monthly: {
      id: string;
      priceId: string;
      price: number; // in cents
      name: string;
      description: string;
      features: string[];
    };
  };
}

// Mock configuration - replace with actual Stripe keys in production
export const stripeConfig: StripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_secret',
  plans: {
    weekly: {
      id: 'weekly_premium',
      priceId: process.env.STRIPE_WEEKLY_PRICE_ID || 'price_mock_weekly',
      price: 900, // $9.00
      name: 'Weekly Premium',
      description: 'Full access to all features with weekly billing',
      features: [
        'Unlimited practice sessions',
        'AI-powered feedback',
        'Advanced analytics',
        'Voice response practice',
        'Priority support'
      ]
    },
    monthly: {
      id: 'monthly_premium',
      priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_mock_monthly',
      price: 2900, // $29.00 (20% discount from weekly)
      name: 'Monthly Premium',
      description: 'Full access with monthly billing - save 20%!',
      features: [
        'Everything in Weekly Premium',
        '20% savings compared to weekly',
        'Extended analytics dashboard',
        'Custom practice plans',
        'Interview scheduling assistance'
      ]
    }
  }
};

export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const calculateSavings = (weeklyPrice: number, monthlyPrice: number): number => {
  const weeklyMonthlyEquivalent = weeklyPrice * 4.33; // Average weeks per month
  return Math.round(((weeklyMonthlyEquivalent - monthlyPrice) / weeklyMonthlyEquivalent) * 100);
};