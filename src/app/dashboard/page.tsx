'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard, Button, Navigation } from '@/components/ui';
import { supabaseHelpers } from '@/lib/supabase-client';
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
  name?: string;
  email?: string;
  trialStartDate?: string;
  subscriptionStatus: 'trial' | 'weekly' | 'monthly' | 'expired';
  questionsUsedToday: number;
  dailyLimit: number;
  currentStreak: number;
  totalQuestions: number;
  achievements: number;
  hasCompletedOnboarding?: boolean;
  preferredIndustry?: string;
  experienceLevel?: string;
  interviewGoal?: string;
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
    questionsUsedToday: 3,
    dailyLimit: 5,
    currentStreak: 2,
    totalQuestions: 12,
    achievements: 3,
    hasCompletedOnboarding: false
  });
  const [daysRemaining, setDaysRemaining] = useState(5);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [interviewGoal, setInterviewGoal] = useState('');

  const loadUserData = async () => {
    try {
      // Get current user
      const { user, error } = await supabaseHelpers.getUser();
      
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }
      
      // Get user profile from database
      const { data: dbProfile } = await supabaseHelpers.getUserProfile(user.id);
      
      // Get user stats
      const { data: stats } = await supabaseHelpers.getUserStats(user.id);
      
      // Get recent sessions
      const { data: sessions } = await supabaseHelpers.getUserSessions(user.id, 5);
      
      // Also check localStorage for quick data
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        
        // Check if user needs onboarding
        if (!parsed.hasCompletedOnboarding) {
          setShowOnboarding(true);
        }
      
        // Calculate trial days remaining
        if (parsed.trialStartDate) {
          const trialStart = new Date(parsed.trialStartDate);
          const now = new Date();
          const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
          const remaining = Math.max(0, 7 - daysSinceStart);
          setDaysRemaining(remaining);
          
          // Update subscription status
          if (remaining === 0) {
            parsed.subscriptionStatus = 'expired';
          }
        }
        
        setProfile({
          ...profile,
          ...parsed,
          email: parsed.email || 'demo@example.com',
          name: parsed.name || 'Demo User'
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Determine limits based on subscription
  const getSubscriptionLimits = () => {
    switch (profile.subscriptionStatus) {
      case 'trial':
        return { daily: 5, industries: 3, buddy: false, resume: false };
      case 'weekly':
        return { daily: 20, industries: 10, buddy: false, resume: false };
      case 'monthly':
        return { daily: 'Unlimited', industries: 'All', buddy: true, resume: true };
      default:
        return { daily: 0, industries: 0, buddy: false, resume: false };
    }
  };

  const limits = getSubscriptionLimits();
  const questionsRemaining = typeof limits.daily === 'number' 
    ? Math.max(0, limits.daily - profile.questionsUsedToday)
    : 'Unlimited';

  const handleOnboardingComplete = () => {
    const updatedProfile = {
      ...profile,
      hasCompletedOnboarding: true,
      preferredIndustry: selectedIndustry,
      experienceLevel: experienceLevel,
      interviewGoal: interviewGoal
    };
    
    setProfile(updatedProfile);
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    
    // Save preferences for practice page
    localStorage.setItem('practicePreferences', JSON.stringify({
      industry: selectedIndustry,
      experienceLevel: experienceLevel
    }));
    
    setShowOnboarding(false);
    router.push('/practice');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl p-8 relative animate-fade-in-up">
            {/* Close button */}
            <button
              onClick={() => setShowOnboarding(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            {/* Step 1: Welcome */}
            {onboardingStep === 1 && (
              <div className="text-center">
                <div className="text-5xl mb-4">👋</div>
                <h2 className="text-3xl font-bold gradient-text-primary mb-4">
                  Welcome to Interview Prep!
                </h2>
                <p className="text-gray-700 mb-8">
                  Let's personalize your experience in just 3 quick steps.
                  This will help us provide the most relevant practice questions for you.
                </p>
                <Button onClick={() => setOnboardingStep(2)} size="lg" className="w-full sm:w-auto">
                  Let's Get Started
                </Button>
              </div>
            )}
            
            {/* Step 2: Select Industry */}
            {onboardingStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Which industry are you targeting?
                </h2>
                <p className="text-gray-600 mb-6">
                  We'll customize your questions based on your industry
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {INDUSTRIES.map((industry) => (
                    <button
                      key={industry.id}
                      onClick={() => setSelectedIndustry(industry.id)}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        selectedIndustry === industry.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{industry.icon}</div>
                      <div className="text-sm font-medium text-gray-700">{industry.name}</div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setOnboardingStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setOnboardingStep(3)}
                    disabled={!selectedIndustry}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Experience Level */}
            {onboardingStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What's your experience level?
                </h2>
                <p className="text-gray-600 mb-6">
                  This helps us adjust the difficulty of your practice questions
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { id: 'entry', label: 'Entry Level', desc: '0-2 years experience' },
                    { id: 'mid', label: 'Mid Level', desc: '2-5 years experience' },
                    { id: 'senior', label: 'Senior Level', desc: '5-10 years experience' },
                    { id: 'executive', label: 'Executive', desc: '10+ years experience' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setExperienceLevel(level.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:scale-[1.02] ${
                        experienceLevel === level.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setOnboardingStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setOnboardingStep(4)}
                    disabled={!experienceLevel}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 4: Interview Goal */}
            {onboardingStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  When's your interview?
                </h2>
                <p className="text-gray-600 mb-6">
                  We'll help you prepare with the right pace
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { id: 'week', label: 'Within a week', desc: 'Intensive daily practice' },
                    { id: 'month', label: 'Within a month', desc: 'Steady preparation pace' },
                    { id: 'exploring', label: 'Just exploring', desc: 'Practice at your own pace' }
                  ].map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setInterviewGoal(goal.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:scale-[1.02] ${
                        interviewGoal === goal.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{goal.label}</div>
                      <div className="text-sm text-gray-600">{goal.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setOnboardingStep(3)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleOnboardingComplete}
                    disabled={!interviewGoal}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    Start Your First Question!
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text-primary">
            Welcome back, {profile.name || 'Interview Prepper'}!
          </h1>
          <p className="text-gray-700 mt-2 font-medium">
            Track your progress and continue preparing for your dream job
          </p>
        </div>

        {/* Trial/Subscription Alert */}
        {profile.subscriptionStatus === 'trial' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-blue-800 font-medium">
                {daysRemaining} days left in your free trial
              </p>
              <p className="text-blue-600 text-sm mt-1">
                Upgrade now to unlock unlimited questions and all features
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm" className="ml-4">
                Upgrade Now
              </Button>
            </Link>
          </div>
        )}

        {profile.subscriptionStatus === 'expired' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">
                Your free trial has ended
              </p>
              <p className="text-red-600 text-sm mt-1">
                Subscribe to continue practicing and improving your interview skills
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm" className="ml-4">
                View Plans
              </Button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold">{profile.totalQuestions}</span>
            </div>
            <p className="text-gray-700 text-sm font-medium">Total Questions</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold">{profile.currentStreak}</span>
            </div>
            <p className="text-gray-700 text-sm font-medium">Day Streak</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold">{profile.achievements}</span>
            </div>
            <p className="text-gray-700 text-sm font-medium">Achievements</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">75%</span>
            </div>
            <p className="text-gray-700 text-sm font-medium">Success Rate</p>
          </GlassCard>
        </div>

        {/* Daily Progress */}
        <GlassCard className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 font-medium">Questions Practiced</span>
                <span className="text-gray-900 font-semibold">
                  {profile.questionsUsedToday} / {limits.daily}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ 
                    width: typeof limits.daily === 'number' 
                      ? `${(profile.questionsUsedToday / limits.daily) * 100}%`
                      : '100%'
                  }}
                />
              </div>
              {questionsRemaining !== 'Unlimited' && questionsRemaining === 0 && (
                <p className="text-sm text-orange-600 font-medium mt-2">
                  Daily limit reached. Upgrade for unlimited questions!
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/practice">
            <GlassCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">Practice Questions</h3>
                  <p className="text-gray-700 text-sm font-medium">
                    {questionsRemaining} questions remaining today
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </GlassCard>
          </Link>

          <Link href={limits.buddy ? "/practice-buddy" : "#"}>
            <GlassCard className={`p-6 transition-transform cursor-pointer ${limits.buddy ? 'hover:scale-105' : 'opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center text-gray-900">
                    Practice Buddy
                    {!limits.buddy && <Lock className="w-4 h-4 ml-2 text-gray-400" />}
                  </h3>
                  <p className="text-gray-700 text-sm font-medium">
                    {limits.buddy ? 'Start a session with a friend' : 'Monthly plan only'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </GlassCard>
          </Link>

          <Link href="/achievements">
            <GlassCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">View Achievements</h3>
                  <p className="text-gray-700 text-sm font-medium">
                    {3 - profile.achievements} new badges available
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </GlassCard>
          </Link>
        </div>

        {/* Recent Activity */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Practice Sessions</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">Behavioral Questions - Retail</p>
                <p className="text-sm text-gray-700 font-medium">2 hours ago • 5 questions</p>
              </div>
              <div className="text-right">
                <p className="text-green-600 font-bold">85%</p>
                <p className="text-xs text-gray-700 font-medium">Score</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">Customer Service Scenarios</p>
                <p className="text-sm text-gray-700 font-medium">Yesterday • 3 questions</p>
              </div>
              <div className="text-right">
                <p className="text-green-600 font-bold">92%</p>
                <p className="text-xs text-gray-700 font-medium">Score</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-gray-900">Leadership & Management</p>
                <p className="text-sm text-gray-700 font-medium">2 days ago • 4 questions</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-600 font-bold">78%</p>
                <p className="text-xs text-gray-700 font-medium">Score</p>
              </div>
            </div>
          </div>
          <Link href="/history">
            <Button variant="outline" className="w-full mt-4">
              View All Sessions
            </Button>
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}