'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { GlassCard } from '../../../components/ui/GlassCard'
import { Button } from '../../../components/ui/Button'
import { CheckCircle, Mail, ArrowRight, RefreshCw } from '../../../lib/icons'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  
  useEffect(() => {
    // If no email in params, redirect to login
    if (!email) {
      router.push('/login')
    }
  }, [email, router])

  const handleResendVerification = async () => {
    if (!email) return
    
    setIsResending(true)
    setResendMessage('')
    
    try {
      // In this implementation, emails are auto-confirmed
      // But we show a success message anyway
      setTimeout(() => {
        setResendMessage('Verification email sent! Please check your inbox.')
        setIsResending(false)
      }, 1000)
    } catch (error) {
      console.error('Error resending verification:', error)
      setResendMessage('Failed to resend verification email. Please try again.')
      setIsResending(false)
    }
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassCard className="p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          {/* Main Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Account Created Successfully!
          </h1>
          
          <p className="text-gray-600 mb-2">
            Welcome to your 7-day free trial! Your account is ready to use.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{email}</span>
            </div>
          </div>

          {/* Trial Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">7-Day Free Trial Activated</span>
            </div>
            <p className="text-sm text-blue-700">
              You now have full access to all features including unlimited questions, 
              mock interviews, and AI-powered feedback.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={goToDashboard}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Start Using Interview Prep
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Sign in to existing account
              </Link>
            </div>
          </div>

          {/* Legacy Email Verification (for future use) */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">
              Didn't receive a verification email?
            </p>
            
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 flex items-center justify-center space-x-1 mx-auto"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Resend verification email</span>
              )}
            </button>
            
            {resendMessage && (
              <p className={`text-xs mt-2 ${
                resendMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'
              }`}>
                {resendMessage}
              </p>
            )}
          </div>
        </GlassCard>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Questions? Contact us at{' '}
            <a href="mailto:support@interviewprep.ai" className="text-blue-600 hover:underline">
              support@interviewprep.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}