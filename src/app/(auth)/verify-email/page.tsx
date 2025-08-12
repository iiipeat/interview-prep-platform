'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GlassCard, Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  /**
   * Resend verification email
   */
  const handleResendVerification = async () => {
    if (!email || isResending) return

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setResendError(error.message)
      } else {
        setResendSuccess(true)
      }
    } catch (error) {
      console.error('Error resending verification:', error)
      setResendError('Failed to resend verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassCard className="p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verify Your Email
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We've sent a verification link to:
            </p>
            
            {email && (
              <p className="text-gray-900 dark:text-white font-medium mb-6 break-words">
                {email}
              </p>
            )}
            
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
              <p>Please check your email and click the verification link to activate your account.</p>
              <p>Your 7-day free trial will begin once your email is verified.</p>
            </div>
          </div>

          {/* Resend Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the email?
            </p>

            {resendSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Verification email sent successfully! Please check your inbox.
                </p>
              </div>
            )}

            {resendError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {resendError}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={isResending || !email}
                loading={isResending}
                variant="outline"
                size="large"
                className="w-full"
              >
                Resend Verification Email
              </Button>

              <Link href="/auth/login">
                <Button variant="primary" size="large" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Still having trouble? Check your spam folder or{' '}
              <a 
                href="mailto:support@interviewprep.com" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                contact support
              </a>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}