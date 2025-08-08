'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from './AuthProvider'

interface LoginFormProps {
  redirectTo?: string
  className?: string
}

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

/**
 * LoginForm component with Google OAuth and email/password authentication
 * Implements security best practices and user-friendly error handling
 */
export function LoginForm({ redirectTo = '/dashboard', className = '' }: LoginFormProps) {
  const router = useRouter()
  const { signIn, signInWithGoogle, loading } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  /**
   * Handle email/password login
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await signIn(formData.email, formData.password)

      if (result.success) {
        router.push(redirectTo)
      } else {
        // Handle different types of errors
        const errorMessage = result.error?.message || 'Login failed'
        
        if (errorMessage.includes('Invalid login credentials')) {
          setErrors({ general: 'Invalid email or password. Please try again.' })
        } else if (errorMessage.includes('Email not confirmed')) {
          setErrors({ general: 'Please check your email and click the confirmation link.' })
        } else if (errorMessage.includes('Too many requests')) {
          setErrors({ general: 'Too many login attempts. Please wait a few minutes and try again.' })
        } else {
          setErrors({ general: errorMessage })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await signInWithGoogle(redirectTo)

      if (!result.success) {
        const errorMessage = result.error?.message || 'Google login failed'
        setErrors({ general: errorMessage })
        setIsSubmitting(false)
      }
      // If successful, the OAuth flow will handle the redirect
    } catch (error) {
      console.error('Google login error:', error)
      setErrors({ general: 'Google login failed. Please try again.' })
      setIsSubmitting(false)
    }
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
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to continue your interview preparation
          </p>
        </div>

        {/* Google OAuth Button */}
        <Button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          variant="outline"
          size="large"
          className="w-full mb-6 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

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

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
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

          <div className="space-y-2">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
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
            size="large"
            className="w-full"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Forgot your password?
          </Link>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  )
}