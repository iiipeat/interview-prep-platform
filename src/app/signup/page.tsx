'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, GlassCard, Input } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle,
  Briefcase,
  Target,
  Star
} from '../../lib/icons';

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | 'profile'>('credentials');
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    careerGoals: '',
    targetRole: '',
    experienceLevel: 'entry'
  });

  const handleGoogleSignUp = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '777077022330-saogm3dkf5ufthfl0r5smvfkef71101o.apps.googleusercontent.com';
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'select_account';
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: responseType,
      scope: scope,
      access_type: accessType,
      prompt: prompt,
    });
    
    // Store the return URL for after authentication
    localStorage.setItem('authReturnUrl', '/');
    
    // Redirect directly to Google OAuth
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create account with unique user ID
      if (!supabase) return;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            full_name: formData.name 
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData?.user) {
        // Store the user ID for the profile step
        localStorage.setItem('tempUserId', authData.user.id);
        
        // Auto-login the user by setting auth session
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUserId', authData.user.id);
        localStorage.setItem('user', JSON.stringify({
          id: authData.user.id,
          email: formData.email,
          name: formData.name
        }));
        
        // Move to profile step
        setStep('profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const userId = localStorage.getItem('tempUserId') || localStorage.getItem('currentUserId');
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Update the user profile with additional information
      if (!supabase) return;
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          full_name: formData.name,
          career_goals: formData.careerGoals,
          target_role: formData.targetRole,
          experience_level: formData.experienceLevel,
          preferences: {
          targetRole: formData.targetRole,
          experienceLevel: formData.experienceLevel
        }
      });
      
      // Clean up temp storage
      localStorage.removeItem('tempUserId');
      
      // Redirect to home page (which will show logged-in content)
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const skipProfile = () => {
    // User is already logged in from the signup step
    // Just set basic profile data
    localStorage.setItem('userProfile', JSON.stringify({
      trialStartDate: new Date().toISOString(),
      subscriptionStatus: 'trial',
      name: formData.name || formData.email.split('@')[0]
    }));
    
    // Redirect to home page (which will show logged-in content)
    router.push('/');
  };

  if (step === 'profile') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-purple-50">
        <GlassCard className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text-primary">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 mt-2">
              Help us personalize your interview prep (optional)
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Role
              </label>
              <Input
                type="text"
                value={formData.targetRole}
                onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                placeholder="e.g., Marketing Manager, Software Engineer"
                leftIcon={<Briefcase className="w-4 h-4" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Career Goals
              </label>
              <textarea
                value={formData.careerGoals}
                onChange={(e) => setFormData({...formData, careerGoals: e.target.value})}
                placeholder="Tell us about your career aspirations..."
                className="glass-input rounded-lg px-4 py-3 text-base w-full h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                className="glass-input rounded-lg px-4 py-3 text-base w-full"
              >
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (6-10 years)</option>
                <option value="executive">Executive (10+ years)</option>
              </select>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
              
              <button
                type="button"
                onClick={skipProfile}
                className="w-full text-gray-500 hover:text-gray-700 text-sm"
              >
                Skip for now →
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Benefits */}
          <div className="hidden md:block">
            <h1 className="text-4xl font-bold gradient-text-primary mb-6">
              Start Your 7-Day Free Trial
            </h1>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Unlimited Practice Questions</h3>
                  <p className="text-gray-700 text-sm">
                    Access AI-generated questions for any industry
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Personalized Feedback</h3>
                  <p className="text-gray-700 text-sm">
                    Get detailed analysis and improvement tips
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Practice with Friends</h3>
                  <p className="text-gray-700 text-sm">
                    Mock interviews with practice buddy feature
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Track Your Progress</h3>
                  <p className="text-gray-700 text-sm">
                    Analytics and achievement system
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Star className="w-4 h-4 inline mr-1" />
                <strong>No credit card required</strong> for free trial
              </p>
            </div>
          </div>

          {/* Right side - Sign up form */}
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              <p className="text-gray-700 mt-2">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-gray-600 font-medium" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.8) 20%, rgba(255,255,255,0.8) 80%, transparent)' }}>Or sign up with email</span>
              </div>
            </div>

            {/* Email Sign Up Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="you@example.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 8 characters"
                  leftIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Re-enter your password"
                  leftIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Start Free Trial'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
