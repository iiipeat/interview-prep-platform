'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

interface FormData {
  email: string
}

interface FormErrors {
  email?: string
  general?: string
}

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<FormData>({ email: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
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
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  /**
   * Handle password reset request
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (!error) {
        setIsSubmitted(true)
      } else {
        const errorMessage = error.message || 'Password reset failed'
        
        if (errorMessage.includes('not found') || errorMessage.includes('invalid')) {
          setErrors({ email: 'No account found with this email address' })
        } else if (errorMessage.includes('rate limit')) {
          setErrors({ general: 'Too many requests. Please wait a few minutes before trying again.' })
        } else {
          setErrors({ general: errorMessage })
        }
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <GlassCard className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Check Your Email
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We've sent a password reset link to:
              </p>
              <p className="text-gray-900 dark:text-white font-medium mb-6">
                {formData.email}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If you don't see the email, check your spam folder or try again with a different email address.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData({ email: '' })
                  setErrors({})
                }}
                variant="outline"
                size="large"
                className="w-full"
              >
                Try Different Email
              </Button>
              
              <Link href="/auth/login">
                <Button variant="primary" size="large" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Reset Your Password
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              name="email"
              placeholder="Enter your email address"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isSubmitting}
              autoComplete="email"
              required
              autoFocus
            />

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
              Send Reset Link
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-4">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Back to Sign In
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
    </div>
  )
}