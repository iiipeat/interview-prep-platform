'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, Button, Navigation } from '@/components/ui';
import { 
  Check,
  X,
  Zap,
  Star,
  Crown,
  TrendingUp,
  Users,
  FileText,
  Lock,
  Sparkles,
  ArrowRight
} from '@/lib/icons';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  popular?: boolean;
  features: {
    text: string;
    included: boolean;
  }[];
  cta: string;
  icon: React.ReactNode;
  color: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    period: '7 days',
    description: 'Perfect for trying out our platform',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-gray-400 to-gray-500',
    features: [
      { text: '5 questions per day', included: true },
      { text: '3 industries available', included: true },
      { text: 'Basic AI feedback', included: true },
      { text: 'Achievement system', included: true },
      { text: 'Progress tracking', included: true },
      { text: 'Practice Buddy', included: false },
      { text: 'Resume upload', included: false },
      { text: 'Unlimited questions', included: false },
    ],
    cta: 'Start Free Trial'
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: 9,
    period: 'week',
    description: 'Great for short-term interview prep',
    icon: <Star className="w-6 h-6" />,
    color: 'from-blue-400 to-blue-500',
    features: [
      { text: '20 questions per day', included: true },
      { text: '10 industries available', included: true },
      { text: 'Advanced AI feedback', included: true },
      { text: 'Achievement system', included: true },
      { text: 'Progress tracking', included: true },
      { text: 'Mock interviews', included: true },
      { text: 'Practice Buddy', included: false },
      { text: 'Resume upload', included: false },
    ],
    cta: 'Get Weekly Access'
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 29,
    period: 'month',
    description: 'Best value for serious job seekers',
    popular: true,
    icon: <Crown className="w-6 h-6" />,
    color: 'from-purple-400 to-purple-500',
    features: [
      { text: 'Unlimited questions', included: true },
      { text: 'All industries available', included: true },
      { text: 'Advanced AI feedback', included: true },
      { text: 'Achievement system', included: true },
      { text: 'Progress tracking', included: true },
      { text: 'Mock interviews', included: true },
      { text: 'Practice Buddy', included: true },
      { text: 'Resume upload & analysis', included: true },
    ],
    cta: 'Go Unlimited'
  }
];

const COMPARISON_FEATURES = [
  { category: 'Practice', items: [
    { name: 'Daily Questions', trial: '5', weekly: '20', monthly: 'Unlimited' },
    { name: 'Industries Available', trial: '3', weekly: '10', monthly: 'All' },
    { name: 'Question Types', trial: 'All', weekly: 'All', monthly: 'All' },
  ]},
  { category: 'Features', items: [
    { name: 'AI Feedback', trial: 'Basic', weekly: 'Advanced', monthly: 'Advanced' },
    { name: 'Mock Interviews', trial: '❌', weekly: '✅', monthly: '✅' },
    { name: 'Practice Buddy', trial: '❌', weekly: '❌', monthly: '✅' },
    { name: 'Resume Analysis', trial: '❌', weekly: '❌', monthly: '✅' },
  ]},
  { category: 'Support', items: [
    { name: 'Progress Tracking', trial: '✅', weekly: '✅', monthly: '✅' },
    { name: 'Achievements', trial: '✅', weekly: '✅', monthly: '✅' },
    { name: 'Export Reports', trial: '❌', weekly: '✅', monthly: '✅' },
    { name: 'Priority Support', trial: '❌', weekly: '❌', monthly: '✅' },
  ]}
];

export default function PricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  
  useEffect(() => {
    // Check user's current subscription
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.subscriptionStatus === 'trial') setCurrentPlan('trial');
      else if (parsed.subscriptionStatus === 'weekly') setCurrentPlan('weekly');
      else if (parsed.subscriptionStatus === 'monthly') setCurrentPlan('monthly');
    }
  }, []);
  
  const handleSelectPlan = (planId: string) => {
    if (planId === 'trial') {
      // Start free trial
      const profile = {
        subscriptionStatus: 'trial',
        trialStartDate: new Date().toISOString(),
        questionsUsedToday: 0,
        dailyLimit: 5
      };
      localStorage.setItem('userProfile', JSON.stringify(profile));
      router.push('/signup?trial=true');
    } else {
      // For paid plans, would integrate with Stripe
      alert(`Payment integration for ${planId} plan coming soon!`);
      // Mock upgrade
      const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      profile.subscriptionStatus = planId;
      profile.dailyLimit = planId === 'weekly' ? 20 : 999;
      localStorage.setItem('userProfile', JSON.stringify(profile));
      router.push('/dashboard');
    }
  };
  
  const calculateSavings = () => {
    const weeklyTotal = 9 * 4; // 4 weeks
    const monthlySavings = weeklyTotal - 29;
    return Math.round((monthlySavings / weeklyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text-primary mb-4">
            Choose Your Interview Success Plan
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Start free, upgrade anytime. No hidden fees.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-white rounded-lg shadow-sm">
            <button
              onClick={() => setBillingPeriod('weekly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'weekly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Save {calculateSavings()}%
              </span>
            </button>
          </div>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PRICING_PLANS.map((plan) => (
            <GlassCard 
              key={plan.id}
              className={`p-8 relative hover:scale-[1.02] transition-all ${
                plan.popular ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
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
              
              <p className="text-gray-600 mb-6">
                {plan.description}
              </p>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${
                      feature.included ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => handleSelectPlan(plan.id)}
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? 'Current Plan' : plan.cta}
                {currentPlan !== plan.id && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </GlassCard>
          ))}
        </div>
        
        {/* Comparison Table Toggle */}
        <div className="text-center mb-8">
          <Button 
            variant="outline"
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? 'Hide' : 'Show'} Detailed Comparison
          </Button>
        </div>
        
        {/* Comparison Table */}
        {showComparison && (
          <GlassCard className="p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Detailed Plan Comparison
            </h2>
            
            {COMPARISON_FEATURES.map((category) => (
              <div key={category.category} className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {category.category}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-4 text-sm font-medium text-gray-600">
                          Feature
                        </th>
                        <th className="text-center py-2 px-4 text-sm font-medium text-gray-600">
                          Free Trial
                        </th>
                        <th className="text-center py-2 px-4 text-sm font-medium text-gray-600">
                          Weekly
                        </th>
                        <th className="text-center py-2 px-4 text-sm font-medium text-gray-600">
                          Monthly
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 pr-4 text-sm text-gray-700">
                            {item.name}
                          </td>
                          <td className="text-center py-3 px-4 text-sm text-gray-600">
                            {item.trial}
                          </td>
                          <td className="text-center py-3 px-4 text-sm text-gray-600">
                            {item.weekly}
                          </td>
                          <td className="text-center py-3 px-4 text-sm text-gray-600 font-medium">
                            {item.monthly}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </GlassCard>
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
                Can I cancel anytime?
              </h3>
              <p className="text-sm text-gray-600">
                Yes! No contracts or cancellation fees. Cancel anytime from your account settings.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens after my trial ends?
              </h3>
              <p className="text-sm text-gray-600">
                Your account remains active but limited. Upgrade to continue practicing without limits.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I switch plans?
              </h3>
              <p className="text-sm text-gray-600">
                Absolutely! Upgrade or downgrade anytime. Changes take effect immediately.
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
            Join thousands of successful job seekers
          </p>
          <Button 
            size="lg"
            onClick={() => handleSelectPlan('trial')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
}