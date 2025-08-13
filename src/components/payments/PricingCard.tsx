'use client';

import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { formatPrice, calculateSavings } from '../../lib/stripe';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  period: 'week' | 'month';
  features: string[];
  popular?: boolean;
  savings?: number;
}

interface PricingCardProps {
  plan: PricingPlan;
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
  currentPlan?: string;
}

export function PricingCard({ plan, onSelectPlan, loading, currentPlan }: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isCurrentPlan = currentPlan === plan.id;
  const priceDisplay = formatPrice(plan.price);

  return (
    <GlassCard
      variant={plan.popular ? "heavy" : "medium"}
      className={`
        relative overflow-hidden transition-all duration-300 transform
        ${isHovered ? 'scale-105 -translate-y-2' : 'scale-100'}
        ${plan.popular ? 'ring-2 ring-blue-400/50' : ''}
        ${isCurrentPlan ? 'ring-2 ring-green-400/50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {plan.popular && (
        <div className="absolute top-0 left-0 right-0">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium text-center py-2">
            Most Popular
          </div>
        </div>
      )}

      <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
          <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
          
          <div className="mb-4">
            <div className="text-4xl font-bold text-white mb-1">
              {priceDisplay}
              <span className="text-lg font-normal text-gray-300">
                /{plan.period}
              </span>
            </div>
            
            {plan.savings && (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm font-medium">
                Save {plan.savings}%
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <svg
                className="w-5 h-5 text-green-400 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-200 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          {isCurrentPlan ? (
            <Button
              variant="outline"
              className="w-full"
              disabled
            >
              Current Plan
            </Button>
          ) : (
            <Button
              variant={plan.popular ? "primary" : "secondary"}
              className="w-full"
              onClick={() => onSelectPlan(plan.id)}
              loading={loading}
            >
              {plan.period === 'week' ? 'Start Weekly Plan' : 'Start Monthly Plan'}
            </Button>
          )}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 
        transition-opacity duration-300
        ${isHovered ? 'opacity-100' : 'opacity-0'}
        pointer-events-none
      `} />
    </GlassCard>
  );
}

// Helper component for the pricing comparison
export function PricingComparison({ weeklyPrice, monthlyPrice }: { weeklyPrice: number; monthlyPrice: number }) {
  const savings = calculateSavings();
  const weeklyEquivalent = weeklyPrice * 4.33; // Average weeks per month

  return (
    <div className="text-center py-8">
      <p className="text-gray-300 mb-2">Pricing Comparison</p>
      <div className="flex items-center justify-center space-x-4 text-sm">
        <span className="text-gray-400">
          Weekly: {formatPrice(weeklyEquivalent)}/month equivalent
        </span>
        <span className="text-green-400 font-medium">
          Monthly: Save {formatPrice(weeklyEquivalent - monthlyPrice)} ({savings}%)
        </span>
      </div>
    </div>
  );
}