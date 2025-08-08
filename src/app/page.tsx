'use client';

import { Button, GlassCard, Input, Navigation } from '../components/ui';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
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
                  Master Your Next
                  <br />
                  <span className="gradient-text-accent">Job Interview</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Practice industry-specific questions, perfect your answers, and build confidence 
                  with AI-powered interview preparation for ANY career path.
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Start 7-Day Free Trial
                  </Button>
                </Link>
                <Link href="/practice?demo=true">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                    Try Demo Questions
                  </Button>
                </Link>
              </div>
              
              {/* Social proof */}
              <div className="pt-8 border-t border-white/20">
                <p className="text-sm text-gray-500 mb-4">
                  Trusted by professionals across all industries
                </p>
                <div className="flex justify-center items-center space-x-8 opacity-60">
                  <div className="text-2xl font-bold text-gray-400">Google</div>
                  <div className="text-2xl font-bold text-gray-400">Meta</div>
                  <div className="text-2xl font-bold text-gray-400">Apple</div>
                  <div className="text-2xl font-bold text-gray-400">Netflix</div>
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto fade-in-up">
            <GlassCard variant="light" size="lg" className="text-center group hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Behavioral Questions</h3>
              <p className="text-gray-600 leading-relaxed">
                Master the STAR method with questions tailored to your industry and experience level.
              </p>
            </GlassCard>
            
            <GlassCard variant="light" size="lg" className="text-center group hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Industry Specific</h3>
              <p className="text-gray-600 leading-relaxed">
                Get questions specific to your field - from healthcare to finance, retail to education.
              </p>
            </GlassCard>
            
            <GlassCard variant="light" size="lg" className="text-center group hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Mock Interviews</h3>
              <p className="text-gray-600 leading-relaxed">
                Practice with AI-powered mock interviews and get personalized feedback on your performance.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>
      
      {/* Newsletter signup section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <GlassCard variant="heavy" size="lg" className="text-center">
            <h2 className="text-3xl font-bold gradient-text-primary mb-4">
              Start Your Free Trial Today
            </h2>
            <p className="text-gray-600 mb-8">
              Join thousands preparing for interviews. 7-day free trial, then choose weekly or monthly plans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  type="email" 
                  placeholder="Enter your email address"
                  className="text-center sm:text-left"
                />
              </div>
              <Link href="/signup">
                <Button size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No spam. Unsubscribe at any time.
            </p>
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
