'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { formatPrice } from '../../lib/stripe';

export interface SubscriptionStatus {
  id: string;
  planName: string;
  status: 'trial' | 'active' | 'canceled' | 'expired' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndDate?: string;
  cancelAtPeriodEnd: boolean;
  priceAmount: number;
  pricePeriod: 'week' | 'month';
}

interface SubscriptionManagerProps {
  userId?: string;
  onSubscriptionChange?: (status: SubscriptionStatus | null) => void;
}

export function SubscriptionManager({ userId, onSubscriptionChange }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subscription status
  useEffect(() => {
    loadSubscriptionStatus();
  }, [userId]);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setSubscription(data.data);
        onSubscriptionChange?.(data.data);
      } else {
        setSubscription(null);
        onSubscriptionChange?.(null);
      }
    } catch (err) {
      console.error('Failed to load subscription status:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You\'ll continue to have access until the end of your current billing period.'
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadSubscriptionStatus(); // Reload status
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Cancel subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadSubscriptionStatus(); // Reload status
      } else {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }
    } catch (err) {
      console.error('Reactivate subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/payments/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        throw new Error(data.error || 'Failed to create billing portal session');
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'trial':
        return 'text-blue-400';
      case 'active':
        return 'text-green-400';
      case 'canceled':
        return 'text-yellow-400';
      case 'expired':
      case 'past_due':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'trial':
        return 'Free Trial';
      case 'active':
        return 'Active';
      case 'canceled':
        return 'Canceled';
      case 'expired':
        return 'Expired';
      case 'past_due':
        return 'Payment Due';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <GlassCard variant="light" className="animate-pulse">
        <div className="p-6">
          <div className="h-4 bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="h-3 bg-gray-600 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-600 rounded w-2/3"></div>
        </div>
      </GlassCard>
    );
  }

  if (!subscription) {
    return (
      <GlassCard variant="light">
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">No Active Subscription</h3>
          <p className="text-gray-300 mb-4">
            Start your free trial to access premium features.
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/pricing'}
          >
            View Plans
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="medium">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">{subscription.planName}</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${getStatusColor(subscription.status)}`}>
                {getStatusText(subscription.status)}
              </span>
              {subscription.cancelAtPeriodEnd && (
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">
                  Cancels {formatDate(subscription.currentPeriodEnd)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatPrice(subscription.priceAmount)}
            </div>
            <div className="text-sm text-gray-300">per {subscription.pricePeriod}</div>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="space-y-3 mb-6">
          {subscription.status === 'trial' && subscription.trialEndDate && (
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
              <p className="text-sm text-blue-200">
                <span className="font-medium">Free trial ends:</span> {formatDate(subscription.trialEndDate)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Current period:</span>
              <div className="text-white font-medium">
                {formatDate(subscription.currentPeriodStart)}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Next billing:</span>
              <div className="text-white font-medium">
                {formatDate(subscription.currentPeriodEnd)}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              loading={actionLoading}
              className="w-full text-red-300 border-red-400/30 hover:bg-red-500/10"
            >
              Cancel Subscription
            </Button>
          )}

          {subscription.cancelAtPeriodEnd && (
            <Button
              variant="primary"
              onClick={handleReactivateSubscription}
              loading={actionLoading}
              className="w-full"
            >
              Reactivate Subscription
            </Button>
          )}

          {(subscription.status === 'active' || subscription.status === 'past_due') && (
            <Button
              variant="secondary"
              onClick={handleManageBilling}
              loading={actionLoading}
              className="w-full"
            >
              Manage Billing
            </Button>
          )}

          {(subscription.status === 'expired' || subscription.status === 'canceled') && (
            <Button
              variant="primary"
              onClick={() => window.location.href = '/pricing'}
              className="w-full"
            >
              Renew Subscription
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Need help? Contact our{' '}
            <a href="mailto:support@interviewprep.com" className="text-blue-400 hover:text-blue-300">
              support team
            </a>
          </p>
        </div>
      </div>
    </GlassCard>
  );
}