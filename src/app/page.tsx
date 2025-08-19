'use client';

import { Button, GlassCard, Navigation } from '../components/ui';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../components/auth/AuthProvider';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [userName, setUserName] = useState('');
  const [isLocalAuth, setIsLocalAuth] = useState(false);

  useEffect(() => {
    // Check authentication status once loading is complete
    if (!loading) {
      console.log('Page: Checking auth status', { user: !!user, isAuthenticated, loading })
      
      // Check localStorage for authentication (fallback for OAuth and test login)
      const localAuth = localStorage.getItem('isAuthenticated') === 'true';
      const localUser = localStorage.getItem('user');
      
      if (localAuth && localUser) {
        console.log('Page: Found local auth, setting up local user')
        setIsLocalAuth(true);
        try {
          const userData = JSON.parse(localUser);
          setUserName(userData.name || userData.email?.split('@')[0] || 'User');
        } catch {
          setUserName('User');
        }
      } else if (user && isAuthenticated) {
        console.log('Page: Found Supabase user, setting up authenticated user')
        // Use authenticated user's name
        const name = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'User';
        setUserName(name);
      } else {
        console.log('Page: No authentication found, redirecting to welcome')
        // Only redirect if truly not authenticated
        router.push('/welcome');
      }
    }
  }, [user, loading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated after loading, show nothing (redirecting)
  if (!isAuthenticated && !isLocalAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Redirecting to welcome page...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-3/4 left-1/6 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl float" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          {/* Main hero content */}
          <GlassCard 
            variant="medium" 
            size="xl" 
            animated={true}
            className="max-w-4xl mx-auto mb-12"
            hover={false}
          >
            <div className="space-y-8">
              {/* Hero headline */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-bold gradient-text-primary leading-tight">
                  Welcome back,
                  <br />
                  <span className="gradient-text-accent">{userName}!</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Ready to ace your next interview? Let's continue your journey to career success.
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/practice">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Start Practicing
                  </Button>
                </Link>
                <Link href="/mock-interviews">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                    Take Mock Interview
                  </Button>
                </Link>
              </div>
              
              {/* Quick Stats */}
              <div className="pt-8 border-t border-white/20">
                <p className="text-sm text-gray-500 mb-4">
                  Your Interview Prep Journey
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold gradient-text-primary">0</div>
                    <div className="text-sm text-gray-500">Questions Practiced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold gradient-text-primary">0</div>
                    <div className="text-sm text-gray-500">Mock Interviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold gradient-text-primary">7</div>
                    <div className="text-sm text-gray-500">Days Left in Trial</div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto fade-in-up">
            <Link href="/practice?category=behavioral" className="block">
              <GlassCard variant="light" size="lg" className="text-center group hover:scale-105 cursor-pointer">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Behavioral Questions</h3>
                <p className="text-gray-600 leading-relaxed">
                  Master the STAR method with questions tailored to your industry and experience level.
                </p>
                <div className="mt-4 text-blue-600 font-medium">Practice Now →</div>
              </GlassCard>
            </Link>
            
            <Link href="/practice?category=industry" className="block">
              <GlassCard variant="light" size="lg" className="text-center group hover:scale-105 cursor-pointer">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Industry Specific</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get questions specific to your field - from healthcare to finance, retail to education.
                </p>
                <div className="mt-4 text-purple-600 font-medium">Practice Now →</div>
              </GlassCard>
            </Link>
            
            <Link href="/mock-interviews" className="block">
              <GlassCard variant="light" size="lg" className="text-center group hover:scale-105 cursor-pointer">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Mock Interviews</h3>
                <p className="text-gray-600 leading-relaxed">
                  Practice with AI-powered mock interviews and get personalized feedback on your performance.
                </p>
                <div className="mt-4 text-green-600 font-medium">Start Interview →</div>
              </GlassCard>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Quick Actions Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="heavy" size="lg" className="text-center">
            <h2 className="text-3xl font-bold gradient-text-primary mb-8">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="w-full">
                  📊 View Dashboard
                </Button>
              </Link>
              <Link href="/resources">
                <Button variant="outline" size="lg" className="w-full">
                  📚 Browse Resources
                </Button>
              </Link>
              <Link href="/achievements">
                <Button variant="outline" size="lg" className="w-full">
                  🏆 Check Achievements
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/20">
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="light" size="md" className="text-center">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-xl font-bold gradient-text-primary">
                  Interview Prep Platform
                </span>
              </div>
              <div className="text-sm text-gray-500">
                © 2025 Interview Prep Platform. All rights reserved.
              </div>
            </div>
          </GlassCard>
        </div>
      </footer>
    </div>
  );
}
