'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard, Button, Navigation } from '@/components/ui';
import { ProgressTracker } from '@/components/feedback';
import { supabase } from '@/lib/supabase';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  Award,
  BarChart3,
  Users,
  FileText,
  Lock,
  Zap,
  Calendar,
  ChevronRight,
  AlertCircle,
  X,
  CheckCircle
} from '@/lib/icons';

interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  trialEndDate?: string;
  subscriptionStatus: 'trial' | 'weekly' | 'expired';
  promptsUsedToday: number;
  dailyPromptLimit: number;
  totalQuestions: number;
  streak: number;
  achievements: number;
  successRate: number;
  hasCompletedOnboarding?: boolean;
  nextBillingDate?: string;
  preferences?: {
    industry?: string;
    experienceLevel?: string;
    targetRole?: string;
  };
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const INDUSTRIES = [
  { id: 'tech', name: 'Technology', icon: '💻' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'retail', name: 'Retail', icon: '🛍️' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'hospitality', name: 'Hospitality', icon: '🏨' },
  { id: 'marketing', name: 'Marketing', icon: '📈' },
  { id: 'consulting', name: 'Consulting', icon: '💼' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    subscriptionStatus: 'trial',
    promptsUsedToday: 0,
    dailyPromptLimit: 20,
    totalQuestions: 0,
    streak: 0,
    achievements: 0,
    successRate: 0,
    hasCompletedOnboarding: false
  });
  const [daysRemaining, setDaysRemaining] = useState(7);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [interviewGoal, setInterviewGoal] = useState('');
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { user, error } = await supabase.auth.getUser();
      
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }
      
      // Get user profile from database
      const { data: dbProfile } = await supabaseHelpers.getUserProfile(user.id);
      
      if (dbProfile) {
        // Check if user needs onboarding
        if (!dbProfile.hasCompletedOnboarding) {
          setShowOnboarding(true);
        }
        
        // Calculate trial days remaining
        if (dbProfile.trialEndDate) {
          const trialEnd = new Date(dbProfile.trialEndDate);
          const now = new Date();
          const remaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          setDaysRemaining(remaining);
          
          // Update subscription status if trial expired
          if (remaining === 0 && dbProfile.subscriptionStatus === 'trial') {
            dbProfile.subscriptionStatus = 'expired';
          }
        }
        
        setProfile(dbProfile);
        
        // Load preferences
        if (dbProfile.preferences) {
          setSelectedIndustry(dbProfile.preferences.industry || '');
          setExperienceLevel(dbProfile.preferences.experienceLevel || '');
          setInterviewGoal(dbProfile.preferences.targetRole || '');
        }
      }
      
      // Get recent sessions
      const { data: sessions } = await supabaseHelpers.getUserSessions(user.id, 5);
      if (sessions) {
        setRecentSessions(sessions);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    
    // Check for welcome flag
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('welcome') === 'true') {
      setShowOnboarding(true);
    }
  }, []);

  // Get subscription limits for simplified model
  const getSubscriptionLimits = () => {
    const hasActiveAccess = profile.subscriptionStatus === 'trial' || profile.subscriptionStatus === 'weekly';
    return {
      daily: hasActiveAccess ? 20 : 0,
      industries: hasActiveAccess ? 'all' : 0,
      buddy: false, // Not available in simplified model
      resume: false // Not available in simplified model
    };
  };

  const handleOnboardingComplete = async () => {
    try {
      if (profile.id) {
        await supabaseHelpers.updateUserProfile(profile.id, {
          hasCompletedOnboarding: true,
          preferences: {
            industry: selectedIndustry,
            experienceLevel: experienceLevel,
            targetRole: interviewGoal
          }
        });
      }
      setShowOnboarding(false);
      await loadUserData(); // Reload to get updated profile
    } catch (error) {
      console.error('Error saving onboarding:', error);
    }
  };

  const handleNextStep = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      handleOnboardingComplete();
    }
  };

  const limits = getSubscriptionLimits();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.name || profile.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Track your progress and continue your interview preparation journey.
          </p>
        </div>

        {/* Subscription Status Widget */}
        <GlassCard className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
            {profile.subscriptionStatus === 'weekly' ? (
              <Link href="/api/payments/billing-portal" target="_blank">
                <Button size="sm" variant="outline">
                  Manage Subscription
                </Button>
              </Link>
            ) : profile.subscriptionStatus === 'trial' ? (
              <Link href="/pricing">
                <Button size="sm" variant="primary">
                  Upgrade Now
                </Button>
              </Link>
            ) : null}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription Info */}
            <div>
              <div className="flex items-center mb-2">
                {profile.subscriptionStatus === 'trial' ? (
                  <>
                    <Zap className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Free Trial</span>
                  </>
                ) : profile.subscriptionStatus === 'weekly' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-gray-900">Weekly Subscription</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-gray-900">Expired</span>
                  </>
                )}
              </div>
              {profile.subscriptionStatus === 'trial' && daysRemaining > 0 && (
                <p className="text-sm text-gray-600">{daysRemaining} days left in trial</p>
              )}
              {profile.subscriptionStatus === 'weekly' && profile.nextBillingDate && (
                <p className="text-sm text-gray-600">
                  Next billing: {new Date(profile.nextBillingDate).toLocaleDateString()}
                </p>
              )}
              {profile.subscriptionStatus === 'expired' && (
                <p className="text-sm text-red-600">Trial has expired - upgrade to continue</p>
              )}
            </div>
            
            {/* Prompt Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Daily Prompts</span>
                <span className="text-sm text-gray-600">
                  {profile.promptsUsedToday}/{profile.dailyPromptLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (profile.promptsUsedToday / profile.dailyPromptLimit) * 100)}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.max(0, profile.dailyPromptLimit - profile.promptsUsedToday)} prompts remaining today
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{profile.promptsUsedToday}</span>
            </div>
            <p className="text-sm text-gray-600">Prompts Used Today</p>
            <p className="text-xs text-gray-500 mt-1">Out of {profile.dailyPromptLimit} daily limit</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{profile.totalQuestions}</span>
            </div>
            <p className="text-sm text-gray-600">Total Questions</p>
            <p className="text-xs text-gray-500 mt-1">All time practice</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{profile.streak}</span>
            </div>
            <p className="text-sm text-gray-600">Day Streak</p>
            <p className="text-xs text-gray-500 mt-1">Keep it going!</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{profile.successRate}%</span>
            </div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-xs text-gray-500 mt-1">Keep improving</p>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/practice" className="block">
            <GlassCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Practice Questions</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Start your daily practice session
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </GlassCard>
          </Link>

          <Link href="/mock-interviews" className="block">
            <GlassCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Mock Interview</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Full interview simulation
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </GlassCard>
          </Link>

          <Link href="/resources" className="block">
            <GlassCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Study guides and tips
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </GlassCard>
          </Link>
        </div>

        {/* Recent Activity */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Practice Sessions</h2>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session, index) => (
                <div key={session.id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{session.question_type || 'Practice Session'}</p>
                      <p className="text-sm text-gray-600">
                        {session.industry || 'General'} • {session.difficulty || 'Medium'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(session.created_at || Date.now()).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      Score: {session.score || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No practice sessions yet</p>
              <Link href="/practice">
                <Button size="sm" className="mt-3">
                  Start Practicing
                </Button>
              </Link>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center z-50 p-4">
          <GlassCard className="max-w-md w-full p-8 relative" data-onboarding>
            <button
              onClick={() => setShowOnboarding(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            {onboardingStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Interview Prep! 🎯</h2>
                <p className="text-gray-700 mb-6">
                  Let's personalize your experience in just 3 quick steps.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">20 AI prompts daily during trial</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Access to all industries</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">AI-powered feedback</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Just $5/week after trial</span>
                  </div>
                </div>
                <Button onClick={handleNextStep} className="w-full">
                  Get Started
                </Button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Your Industry</h2>
                <p className="text-gray-700 mb-6">
                  We'll tailor questions to your field.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {INDUSTRIES.slice(0, 6).map((industry) => (
                    <button
                      key={industry.id}
                      onClick={() => setSelectedIndustry(industry.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedIndustry === industry.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{industry.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{industry.name}</div>
                    </button>
                  ))}
                </div>
                <Button 
                  onClick={handleNextStep} 
                  className="w-full"
                  disabled={!selectedIndustry}
                >
                  Continue
                </Button>
              </div>
            )}

            {onboardingStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Experience Level</h2>
                <p className="text-gray-700 mb-6">
                  This helps us adjust question difficulty.
                </p>
                <div className="space-y-3 mb-6">
                  {['Entry Level', 'Mid Level', 'Senior', 'Executive'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setExperienceLevel(level)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        experienceLevel === level
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{level}</div>
                    </button>
                  ))}
                </div>
                <Button 
                  onClick={handleNextStep} 
                  className="w-full"
                  disabled={!experienceLevel}
                >
                  Complete Setup
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}