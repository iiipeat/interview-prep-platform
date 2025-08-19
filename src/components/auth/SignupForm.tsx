'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GlassCard } from '../ui/GlassCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from './AuthProvider'
import { GoogleSignInButton } from './GoogleSignInButton'

interface SignupFormProps {
  redirectTo?: string
  className?: string
}

interface FormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  // Optional career profile fields
  currentRole?: string
  targetRole?: string
  experienceLevel?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive'
  industry?: string
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  currentRole?: string
  targetRole?: string
  experienceLevel?: string
  industry?: string
  general?: string
}

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-1 years)' },
  { value: 'junior', label: 'Junior (1-3 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior (5-8 years)' },
  { value: 'lead', label: 'Lead (8+ years)' },
  { value: 'executive', label: 'Executive (C-level)' },
]

const COMMON_INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Marketing',
  'Government',
  'Non-profit',
  'Other'
]

/**
 * SignupForm component with Google OAuth and email/password registration
 * Includes optional career profile setup for personalized experience
 */
export function SignupForm({ redirectTo = '/dashboard', className = '' }: SignupFormProps) {
  const router = useRouter()
  const { signUp, signInWithGoogle, loading } = useAuth()
  
  const [step, setStep] = useState<'basic' | 'profile'>('basic')
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    currentRole: '',
    targetRole: '',
    experienceLevel: undefined,
    industry: '',
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showProfileStep, setShowProfileStep] = useState(false)

  /**
   * Password strength checker
   */
  const checkPasswordStrength = (password: string) => {
    const minLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
    
    return {
      score,
      feedback: {
        minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial,
      }
    }
  }

  /**
   * Validate basic form data
   */
  const validateBasicForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const strength = checkPasswordStrength(formData.password)
      if (strength.score < 3) {
        newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number'
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  /**
   * Handle basic form submission (step 1)
   */
  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateBasicForm()) return

    // Move to profile step or directly signup
    if (showProfileStep) {
      setStep('profile')
    } else {
      handleSignup()
    }
  }

  /**
   * Handle profile form submission (step 2)
   */
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSignup()
  }

  /**
   * Handle user registration
   */
  const handleSignup = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const profileData = step === 'profile' ? {
        current_role: formData.currentRole,
        target_role: formData.targetRole,
        experience_level: formData.experienceLevel,
        industry: formData.industry,
      } : undefined

      const result = await signUp(
        formData.email,
        formData.password,
        formData.fullName.trim(),
        profileData
      )

      if (result.success) {
        // Account created successfully, now sign the user in automatically
        const loginResult = await signIn(formData.email, formData.password)
        
        if (loginResult.success) {
          // Successfully signed in, redirect to dashboard
          router.push('/dashboard')
        } else {
          // Account was created but auto-login failed, redirect to verify page
          router.push('/auth/verify-email?email=' + encodeURIComponent(formData.email))
        }
      } else {
        const errorMessage = result.error?.message || 'Registration failed'
        
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          setErrors({ email: 'An account with this email already exists' })
        } else if (errorMessage.includes('Password should be at least 6 characters')) {
          setErrors({ password: 'Password must be at least 6 characters long' })
        } else if (errorMessage.includes('Signup requires a valid password')) {
          setErrors({ password: 'Please enter a valid password' })
        } else {
          setErrors({ general: errorMessage })
        }
        
        // Go back to basic step if there's an error
        setStep('basic')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
      setStep('basic')
    } finally {
      setIsSubmitting(false)
    }
  }


  /**
   * Skip profile step
   */
  const skipProfile = () => {
    setShowProfileStep(false)
    setStep('basic')
    handleSignup()
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <GlassCard className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'basic' ? 'Create Account' : 'Career Profile'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'basic' 
              ? 'Start your 7-day free trial today'
              : 'Help us personalize your interview prep experience'
            }
          </p>
          {step === 'profile' && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          )}
        </div>

        {step === 'basic' && (
          <>
            {/* Google OAuth Button */}
            <GoogleSignInButton
              text="signup_with"
              disabled={isSubmitting}
              className="mb-6"
            />

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Basic Form */}
            <form onSubmit={handleBasicSubmit} className="space-y-4">
              <Input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                label="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                disabled={isSubmitting}
                autoComplete="name"
                required
              />

              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                disabled={isSubmitting}
                autoComplete="email"
                required
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />

              {formData.password && (
                <div className="text-xs space-y-1">
                  {(() => {
                    const strength = checkPasswordStrength(formData.password)
                    return (
                      <div className="space-y-1">
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <div
                              key={i}
                              className={`h-1 w-full rounded ${
                                i < strength.score 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${
                          strength.score >= 3 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {strength.score < 3 ? 'Weak password' : 'Strong password'}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}

              <Input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm your password"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showPassword ? 'Hide passwords' : 'Show passwords'}
              </button>

              {/* Profile Step Toggle */}
              <div className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  id="showProfile"
                  checked={showProfileStep}
                  onChange={(e) => setShowProfileStep(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showProfile" className="text-gray-700 dark:text-gray-300">
                  Set up career profile for personalized experience (optional)
                </label>
              </div>

              {/* General Error Message */}
              {errors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.general}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {showProfileStep ? 'Next: Career Profile' : 'Start Free Trial'}
              </Button>
            </form>
          </>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              type="text"
              name="currentRole"
              placeholder="e.g., Software Engineer"
              label="Current Role"
              value={formData.currentRole || ''}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <Input
              type="text"
              name="targetRole"
              placeholder="e.g., Senior Software Engineer"
              label="Target Role"
              value={formData.targetRole || ''}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experience Level
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel || ''}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your experience level</option>
                {EXPERIENCE_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry
              </label>
              <select
                name="industry"
                value={formData.industry || ''}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your industry</option>
                {COMMON_INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={isSubmitting}
                onClick={skipProfile}
              >
                Skip for Now
              </Button>
              
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                Complete Setup
              </Button>
            </div>
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Terms and Privacy */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Privacy Policy
            </a>
          </p>
        </div>
      </GlassCard>
    </div>
  )
}