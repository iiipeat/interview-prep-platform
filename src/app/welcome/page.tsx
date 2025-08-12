'use client';

import { Button, GlassCard } from '../../components/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/6 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">I</span>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Interview Prep Platform
            </span>
          </div>
        </div>

        {/* Welcome Card */}
        <GlassCard variant="heavy" size="xl" className="max-w-2xl w-full text-center">
          <div className="space-y-6 p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Master Your Next
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Job Interview
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Practice industry-specific questions, perfect your answers, and build confidence with AI-powered interview preparation.
            </p>

            <div className="pt-6 space-y-4">
              <p className="text-sm text-gray-500">
                Please log in or sign up to access the platform
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="flex-1 sm:flex-initial">
                  <Button size="lg" className="w-full sm:w-auto px-8">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1 sm:flex-initial">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="pt-8 mt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">7-Day Free Trial</h3>
                  <p className="text-sm text-gray-600 mt-1">Start practicing immediately</p>
                </div>
                <div>
                  <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">AI-Powered</h3>
                  <p className="text-sm text-gray-600 mt-1">Personalized feedback</p>
                </div>
                <div>
                  <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Industry Specific</h3>
                  <p className="text-sm text-gray-600 mt-1">Tailored to your field</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © 2025 Interview Prep Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}