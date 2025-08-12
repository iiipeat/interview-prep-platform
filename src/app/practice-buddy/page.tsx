'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, Button, Navigation } from '../../components/ui';
import { 
  Users,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  User,
  Search,
  Calendar,
  CheckCircle,
  Lock,
  Zap,
  Copy,
  ExternalLink
} from '../../lib/icons';

type BuddyStatus = 'setup' | 'waiting' | 'matched' | 'inSession' | 'completed';

interface BuddySession {
  id: string;
  partnerId?: string;
  partnerName?: string;
  partnerIndustry?: string;
  partnerLevel?: string;
  sessionCode?: string;
  questions: string[];
  currentQuestionIndex: number;
  startTime?: Date;
  feedback: SessionFeedback[];
}

interface SessionFeedback {
  questionIndex: number;
  rating: 'good' | 'needs-work';
  notes?: string;
}

interface ScheduledSession {
  id: string;
  date: string;
  time: string;
  partnerName: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export default function PracticeBuddyPage() {
  const router = useRouter();
  const [isMonthlySubscriber, setIsMonthlySubscriber] = useState(false);
  const [status, setStatus] = useState<BuddyStatus>('setup');
  const [sessionType, setSessionType] = useState<'instant' | 'scheduled' | 'friend'>('instant');
  const [session, setSession] = useState<BuddySession | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  
  useEffect(() => {
    // Check subscription status
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setIsMonthlySubscriber(parsed.subscriptionStatus === 'monthly');
    }
  }, []);
  
  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  
  const startInstantMatch = async () => {
    setStatus('waiting');
    
    // TODO: Implement real-time matching with WebSocket or polling
    // This will connect to the backend matching service
    try {
      // Call API to join matching queue
      const response = await fetch('/api/practice-buddy/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchType: 'instant' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setStatus('matched');
      }
    } catch (error) {
      console.error('Error finding match:', error);
      setStatus('idle');
    }
  };
  
  const createFriendSession = async () => {
    const code = generateSessionCode();
    setSessionCode(code);
    
    try {
      // Create session on backend
      const response = await fetch('/api/practice-buddy/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: code })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setStatus('waiting');
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };
  
  const joinFriendSession = async () => {
    if (!friendCode) {
      alert('Please enter a session code');
      return;
    }
    
    try {
      // Join existing session on backend
      const response = await fetch('/api/practice-buddy/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: friendCode })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setStatus('matched');
      } else {
        alert('Invalid session code');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Error joining session');
    }
  };
  
  const startPractice = () => {
    if (!session) return;
    
    setSession({
      ...session,
      startTime: new Date()
    });
    setStatus('inSession');
  };
  
  const submitFeedback = (rating: 'good' | 'needs-work', notes?: string) => {
    if (!session) return;
    
    const newFeedback: SessionFeedback = {
      questionIndex: session.currentQuestionIndex,
      rating,
      notes
    };
    
    const updatedSession = {
      ...session,
      feedback: [...session.feedback, newFeedback],
      currentQuestionIndex: session.currentQuestionIndex + 1
    };
    
    if (updatedSession.currentQuestionIndex >= session.questions.length) {
      setStatus('completed');
    }
    
    setSession(updatedSession);
  };
  
  const copySessionCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      alert('Session code copied!');
    }
  };
  
  const scheduleSession = () => {
    // This would open a calendar/scheduling interface
    alert('Scheduling feature coming soon!');
  };

  // Check if user has access
  if (!isMonthlySubscriber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <GlassCard className="p-12 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Practice Buddy is a Premium Feature
            </h2>
            <p className="text-gray-600 mb-6">
              Upgrade to our Monthly plan to practice with peers and get real-time feedback
            </p>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What you get with Practice Buddy:</h3>
              <ul className="text-left text-sm text-blue-700 space-y-1">
                <li>• Real-time practice with other job seekers</li>
                <li>• Peer feedback and ratings</li>
                <li>• Video practice sessions</li>
                <li>• Scheduled practice appointments</li>
                <li>• Private sessions with friends</li>
              </ul>
            </div>
            <Button onClick={() => router.push('/pricing')} size="lg">
              Upgrade to Monthly Plan
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text-primary mb-2">
            Practice Buddy
          </h1>
          <p className="text-gray-700">
            Practice interviews with peers and exchange feedback
          </p>
        </div>

        {/* Setup Phase */}
        {status === 'setup' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Instant Match */}
            <GlassCard 
              className={`p-6 cursor-pointer hover:scale-[1.02] transition-all ${
                sessionType === 'instant' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSessionType('instant')}
            >
              <Zap className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Instant Match
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Get matched with another user instantly for a quick practice session
              </p>
              {sessionType === 'instant' && (
                <Button onClick={startInstantMatch} className="w-full">
                  Find Partner
                </Button>
              )}
            </GlassCard>
            
            {/* Practice with Friend */}
            <GlassCard 
              className={`p-6 cursor-pointer hover:scale-[1.02] transition-all ${
                sessionType === 'friend' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSessionType('friend')}
            >
              <Users className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Practice with Friend
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create or join a private session with a friend using a code
              </p>
              {sessionType === 'friend' && (
                <div className="space-y-2">
                  <Button onClick={createFriendSession} className="w-full" variant="outline">
                    Create Session
                  </Button>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={friendCode}
                      onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm"
                      maxLength={6}
                    />
                    <Button onClick={joinFriendSession} size="sm">
                      Join
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
            
            {/* Schedule Session */}
            <GlassCard 
              className={`p-6 cursor-pointer hover:scale-[1.02] transition-all ${
                sessionType === 'scheduled' ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSessionType('scheduled')}
            >
              <Calendar className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Schedule Session
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Book a practice session for a specific time with matched partners
              </p>
              {sessionType === 'scheduled' && (
                <Button onClick={scheduleSession} className="w-full">
                  Schedule
                </Button>
              )}
            </GlassCard>
          </div>
        )}

        {/* Waiting for Match */}
        {status === 'waiting' && (
          <GlassCard className="p-12 text-center">
            <div className="animate-pulse">
              <Search className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {sessionCode ? 'Waiting for Friend to Join' : 'Finding Your Practice Partner...'}
            </h2>
            {sessionCode && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Share this code with your friend:</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-mono font-bold text-blue-900">
                    {sessionCode}
                  </span>
                  <button onClick={copySessionCode} className="p-2 hover:bg-blue-100 rounded">
                    <Copy className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>
            )}
            {!sessionCode && (
              <p className="text-gray-600">
                This usually takes 10-30 seconds...
              </p>
            )}
          </GlassCard>
        )}

        {/* Matched - Ready to Start */}
        {status === 'matched' && session && (
          <GlassCard className="p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Partner Found!
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
                <p className="font-semibold text-gray-900">You</p>
                <p className="text-sm text-gray-600">Ready to practice</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
                <p className="font-semibold text-gray-900">{session.partnerName}</p>
                <p className="text-sm text-gray-600">
                  {session.partnerIndustry} • {session.partnerLevel}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Session Format:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 5 interview questions each</li>
                <li>• 2 minutes per answer</li>
                <li>• Take turns being interviewer and interviewee</li>
                <li>• Exchange feedback after each question</li>
              </ul>
            </div>
            
            <Button onClick={startPractice} size="lg" className="w-full">
              Start Practice Session
            </Button>
          </GlassCard>
        )}

        {/* In Session */}
        {status === 'inSession' && session && (
          <div className="space-y-6">
            {/* Video Call Interface (Mock) */}
            <div className="grid md:grid-cols-2 gap-4">
              <GlassCard className="p-4">
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <User className="w-20 h-20 text-gray-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">You</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className={`p-2 rounded-lg ${
                        isVideoOn ? 'bg-gray-100' : 'bg-red-100'
                      }`}
                    >
                      {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-600" />}
                    </button>
                    <button
                      onClick={() => setIsAudioOn(!isAudioOn)}
                      className={`p-2 rounded-lg ${
                        isAudioOn ? 'bg-gray-100' : 'bg-red-100'
                      }`}
                    >
                      {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-600" />}
                    </button>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-4">
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <User className="w-20 h-20 text-gray-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{session.partnerName}</span>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>1:45</span>
                  </div>
                </div>
              </GlassCard>
            </div>
            
            {/* Current Question */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Question {session.currentQuestionIndex + 1} of {session.questions.length}
                </h3>
                <span className="text-sm text-gray-600">Your turn to answer</span>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <p className="text-lg text-gray-900">
                  {session.questions[session.currentQuestionIndex]}
                </p>
              </div>
              
              {/* Quick Feedback */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">How did your partner do?</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => submitFeedback('needs-work')}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Needs Work
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => submitFeedback('good')}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Good Job
                  </Button>
                </div>
              </div>
            </GlassCard>
            
            {/* Question Cards */}
            <div className="flex space-x-2 justify-center">
              {session.questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-12 h-2 rounded-full ${
                    index < session.currentQuestionIndex
                      ? 'bg-green-500'
                      : index === session.currentQuestionIndex
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Session Complete */}
        {status === 'completed' && session && (
          <GlassCard className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Session Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Great job practicing with {session.partnerName}
            </p>
            
            {/* Feedback Summary */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <ThumbsUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">
                  {session.feedback.filter(f => f.rating === 'good').length} Good
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <ThumbsDown className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">
                  {session.feedback.filter(f => f.rating === 'needs-work').length} Needs Work
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button onClick={() => setStatus('setup')} className="flex-1">
                Practice Again
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
                Back to Dashboard
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Scheduled Sessions */}
        {status === 'setup' && scheduledSessions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Sessions
            </h2>
            <div className="space-y-3">
              {scheduledSessions.map((scheduled) => (
                <GlassCard key={scheduled.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {scheduled.partnerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {scheduled.date} at {scheduled.time}
                      </p>
                    </div>
                    <Button size="sm">
                      Join Session
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}