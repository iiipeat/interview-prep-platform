'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, Button, Navigation } from '../../components/ui';
import { 
  Check,
  Zap,
  Star,
  Sparkles,
  ArrowRight,
  Repeat,
  Loader2
} from '../../lib/icons';

interface PricingPlan {
  id: 'weekly' | 'monthly';
  name: string;
  price: number;
  period: string;
  description: string;
  specialOffer?: string;
  features: string[];
  cta: string;
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'weekly',
    name: 'Weekly Access',
    price: 5,
    period: 'week',
    description: '7-day free trial, then $5/week',
    specialOffer: 'Start with 7 days free - cancel anytime',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-green-400 to-green-500',
    popular: false,
    features: [
      '7-day free trial',
      '20 interview questions per day',
      'All industries included',
      'AI-powered feedback',
      'Progress tracking',
      'Achievement system',
      'Basic analytics'
    ],
    cta: 'Start 7-Day Free Trial'
  },
  {
    id: 'monthly',
    name: 'Monthly Unlimited',
    price: 29,
    period: 'month',
    description: 'Best value for serious job seekers',
    specialOffer: 'Save 70% vs weekly - Unlimited questions!',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'from-purple-400 to-purple-500',
    popular: true,
    features: [
      'UNLIMITED interview questions',
      'All industries included',
      'Advanced AI feedback',
      'Priority support',
      'Practice Buddy feature',
      'Resume upload & analysis',
      'Mock video interviews',
      'Personalized study plans'
    ],
    cta: 'Get Monthly Unlimited'
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<'weekly' | 'monthly' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check user's current subscription
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.subscriptionStatus === 'trial' || parsed.subscriptionStatus === 'weekly') {
        setCurrentPlan('weekly');
      } else if (parsed.subscriptionStatus === 'monthly') {
        setCurrentPlan('monthly');
      }
    }
    
    // Check for payment status in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'cancelled') {
      setError('Payment was cancelled. Please try again.');
    }
  }, []);
  
  const handleSelectPlan = async (planId: 'weekly' | 'monthly') => {
    setLoadingPlan(planId);
    setError(null);
    
    try {
      // Check if user is logged in
      const userToken = localStorage.getItem('userToken');
      if (!userToken) {
        // Redirect to signup with plan selection
        router.push(`/signup?plan=${planId}`);
        return;
      }
      
      // Create Stripe checkout session
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          planType: planId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await response.json();
      
      if (data.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
      
      // For development, show a more helpful message
      if (process.env.NODE_ENV === 'development') {
        setError('Stripe is not fully configured. Please add your Stripe keys to .env.local');
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text-primary mb-4">
            Choose Your Interview Prep Plan
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Start with 7 days free, then $5/week OR save big with $29/month unlimited access
          </p>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {PRICING_PLANS.map((plan) => (
            <GlassCard 
              key={plan.id}
              className={`p-8 relative hover:scale-[1.02] transition-all ${
                plan.popular ? 'ring-2 ring-purple-500 shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Best Value
                  </span>
                </div>
              )}
              
              {currentPlan === plan.id && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className={`w-14 h-14 rounded-lg bg-gradient-to-r ${plan.color} flex items-center justify-center text-white mb-4`}>
                {plan.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-600 ml-2">/{plan.period}</span>
              </div>
              
              <p className="text-gray-600 mb-2">
                {plan.description}
              </p>
              
              {plan.specialOffer && (
                <p className="text-sm text-green-600 font-medium mb-6">
                  {plan.specialOffer}
                </p>
              )}
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => handleSelectPlan(plan.id)}
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
                disabled={currentPlan === plan.id || loadingPlan !== null}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentPlan === plan.id ? (
                  'Current Plan'
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </GlassCard>
          ))}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}
        
        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <GlassCard className="p-6">
            <div className="flex items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-3">
              "The Practice Buddy feature alone is worth the monthly subscription. Found my dream job!"
            </p>
            <p className="text-sm font-medium text-gray-900">Sarah K.</p>
            <p className="text-xs text-gray-600">Software Engineer</p>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-3">
              "AI feedback helped me improve my answers dramatically. Landed 3 offers!"
            </p>
            <p className="text-sm font-medium text-gray-900">Michael R.</p>
            <p className="text-xs text-gray-600">Marketing Manager</p>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-3">
              "Best investment for my career. The mock interviews built my confidence!"
            </p>
            <p className="text-sm font-medium text-gray-900">Jennifer L.</p>
            <p className="text-xs text-gray-600">Product Manager</p>
          </GlassCard>
        </div>
        
        {/* FAQ Section */}
        <GlassCard className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens after my 7-day trial?
              </h3>
              <p className="text-sm text-gray-600">
                Your trial automatically converts to $5/week with 20 questions per day. You can upgrade to monthly unlimited anytime.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-sm text-gray-600">
                Yes! No contracts or cancellation fees. Cancel anytime from your account settings.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What's the difference between weekly and monthly?
              </h3>
              <p className="text-sm text-gray-600">
                Weekly ($5/week) gives you 20 questions/day. Monthly ($29/month) gives you UNLIMITED questions plus exclusive features like Practice Buddy and resume analysis.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-sm text-gray-600">
                Yes, we use bank-level encryption and never share your personal information.
              </p>
            </div>
          </div>
        </GlassCard>
        
        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Ace Your Interview?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands who've landed their dream jobs with our AI-powered interview prep
          </p>
          <Button 
            size="lg"
            onClick={() => handleSelectPlan('weekly')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            disabled={loadingPlan !== null}
          >
            {loadingPlan ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Start 7-Day Free Trial
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}