/**
 * Stripe Configuration
 * Mock implementation for development
 * In production, replace with actual Stripe integration
 */

export interface StripePlan {
  id: string;
  priceId: string;
  price: number; // in cents
  name: string;
  description: string;
  features: string[];
  trialDays: number;
  interval: 'week' | 'month';
  popular?: boolean;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  plans: {
    weekly: StripePlan;
    monthly: StripePlan;
  };
}

// Stripe configuration with both weekly and monthly plans
export const stripeConfig: StripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_secret',
  plans: {
    weekly: {
      id: 'interview_prep_weekly',
      priceId: process.env.STRIPE_WEEKLY_PRICE_ID || 'price_mock_weekly_5',
      price: 500, // $5.00/week
      name: 'Weekly Access',
      description: '7-day free trial, then $5/week',
      interval: 'week',
      trialDays: 7,
      features: [
        '7-day free trial',
        '20 AI prompts per day',
        'All industries included',
        'AI-powered feedback',
        'Progress tracking',
        'Achievement system',
        'Basic analytics'
      ]
    },
    monthly: {
      id: 'interview_prep_monthly',
      priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_mock_monthly_29',
      price: 2900, // $29.00/month
      name: 'Monthly Unlimited',
      description: 'Best value - Unlimited everything!',
      interval: 'month',
      trialDays: 7,
      popular: true,
      features: [
        '7-day free trial',
        'UNLIMITED AI prompts',
        'All industries included',
        'Advanced AI feedback',
        'Priority support',
        'Practice Buddy feature',
        'Resume upload & analysis',
        'Mock video interviews',
        'Personalized study plans',
        'Advanced analytics & insights'
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

/**
 * Get all subscription plans
 */
export const getPlans = () => stripeConfig.plans;

/**
 * Get a specific plan by ID
 */
export const getPlanById = (planId: 'weekly' | 'monthly') => stripeConfig.plans[planId];

/**
 * Calculate savings for monthly vs weekly
 */
export const calculateSavings = (): number => {
  const weeklyMonthCost = stripeConfig.plans.weekly.price * 4; // 4 weeks
  const monthlyCost = stripeConfig.plans.monthly.price;
  const savings = ((weeklyMonthCost - monthlyCost) / weeklyMonthCost) * 100;
  return Math.round(savings);
};

/**
 * Calculate trial end date from start date
 */
export const calculateTrialEndDate = (startDate: Date = new Date()): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + stripeConfig.plans.weekly.trialDays);
  return endDate;
};

/**
 * Check if a given date is within the trial period
 */
export const isWithinTrialPeriod = (trialStartDate: string, trialEndDate: string): boolean => {
  const now = new Date();
  const start = new Date(trialStartDate);
  const end = new Date(trialEndDate);
  return now >= start && now <= end;
};

/**
 * Calculate days remaining in trial
 */
export const getDaysRemainingInTrial = (trialEndDate: string): number => {
  const now = new Date();
  const end = new Date(trialEndDate);
  const timeDiff = end.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(0, daysDiff);
};