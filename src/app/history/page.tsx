'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Navigation } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { 
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
  ChevronRight,
  Star,
  Target,
  Award,
  ArrowUp,
  ArrowDown,
  Minus
} from '../../lib/icons';

interface Session {
  id: string;
  date: string;
  questions: QuestionRecord[];
  overallScore: number;
  duration: number; // in minutes
  type: 'practice' | 'mock';
  industry: string;
  difficulty: string;
}

interface QuestionRecord {
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'cultural';
  score: number;
  timeSpent: number;
  feedback?: string;
}

interface PerformanceStats {
  totalSessions: number;
  averageScore: number;
  totalTime: number;
  questionsAnswered: number;
  bestScore: number;
  improvement: number;
  strongestCategory: string;
  weakestCategory: string;
}

// Sessions will be loaded from database

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedType, setSelectedType] = useState('all');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PerformanceStats>({
    totalSessions: 0,
    averageScore: 0,
    totalTime: 0,
    questionsAnswered: 0,
    bestScore: 0,
    improvement: 0,
    strongestCategory: '',
    weakestCategory: ''
  });
  
  useEffect(() => {
    loadSessionHistory();
  }, []);
  
  const loadSessionHistory = async () => {
    try {
      // Load sessions from localStorage (fallback to Supabase)
      const practiceSessions = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
      const userResponses = JSON.parse(localStorage.getItem('userResponses') || '[]');
      const currentSession = JSON.parse(localStorage.getItem('currentSession') || '{}');
      
      // Transform stored sessions into display format
      const transformedSessions: Session[] = [];
      
      // Add practice sessions
      practiceSessions.forEach((session: any) => {
        // Find matching response
        const response = userResponses.find((r: any) => r.question_id === session.id);
        
        if (response && response.feedback) {
          const feedback = typeof response.feedback === 'string' 
            ? JSON.parse(response.feedback) 
            : response.feedback;
          
          transformedSessions.push({
            id: session.id,
            date: session.created_at || new Date().toISOString(),
            questions: [{
              question: session.question_text || session.question || 'Practice Question',
              type: session.question_type || 'behavioral',
              score: feedback.score || response.score || 75,
              timeSpent: 120, // Default 2 minutes
              feedback: feedback.summary || ''
            }],
            overallScore: feedback.score || response.score || 75,
            duration: 5, // Default 5 minutes per session
            type: 'practice',
            industry: session.industry || 'general',
            difficulty: session.difficulty || 'medium'
          });
        }
      });
      
      // Load sessions from database if available
      if (supabase) {
      if (!supabase) return;
        const { data: dbSessions } = await supabase
          .from('practice_sessions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (dbSessions) {
          // Transform database sessions to display format
          // Add transformation logic here based on actual DB schema
        }
      }
      
      // Add mock data for demonstration
      const mockSessions = [
        {
          id: 'mock-1',
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          questions: [
            {
              question: 'Describe a challenging situation you overcame',
              type: 'behavioral',
              score: 78,
              timeSpent: 120
            }
          ],
          overallScore: 78,
          duration: 5,
          type: 'practice',
          industry: 'retail',
          difficulty: 'easy'
        }
      ];
      transformedSessions.push(...mockSessions as Session[]);
      
      // Sort by date (newest first)
      transformedSessions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setSessions(transformedSessions);
      setFilteredSessions(transformedSessions);
      calculateStats(transformedSessions);
    } catch (error) {
      console.error('Error loading session history:', error);
      // Use minimal mock data as fallback
      setSessions([]);
      setFilteredSessions([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    filterSessions();
  }, [selectedPeriod, selectedType, sessions]);
  
  const calculateStats = (sessionData: Session[]) => {
    if (sessionData.length === 0) return;
    
    const totalQuestions = sessionData.reduce((sum, s) => sum + s.questions.length, 0);
    const totalScore = sessionData.reduce((sum, s) => sum + s.overallScore, 0);
    const totalMinutes = sessionData.reduce((sum, s) => sum + s.duration, 0);
    
    // Calculate category performance
    const categoryScores: { [key: string]: number[] } = {};
    sessionData.forEach(session => {
      session.questions.forEach(q => {
        if (!categoryScores[q.type]) categoryScores[q.type] = [];
        categoryScores[q.type].push(q.score);
      });
    });
    
    const categoryAverages = Object.entries(categoryScores).map(([cat, scores]) => ({
      category: cat,
      average: scores.reduce((a, b) => a + b, 0) / scores.length
    }));
    
    const strongest = categoryAverages.reduce((max, cat) => 
      cat.average > max.average ? cat : max
    );
    const weakest = categoryAverages.reduce((min, cat) => 
      cat.average < min.average ? cat : min
    );
    
    // Calculate improvement (compare last 5 to previous 5)
    const recent = sessionData.slice(-5);
    const previous = sessionData.slice(-10, -5);
    const recentAvg = recent.reduce((sum, s) => sum + s.overallScore, 0) / recent.length || 0;
    const previousAvg = previous.reduce((sum, s) => sum + s.overallScore, 0) / previous.length || 0;
    
    setStats({
      totalSessions: sessionData.length,
      averageScore: Math.round(totalScore / sessionData.length),
      totalTime: totalMinutes,
      questionsAnswered: totalQuestions,
      bestScore: Math.max(...sessionData.map(s => s.overallScore)),
      improvement: Math.round(recentAvg - previousAvg),
      strongestCategory: strongest.category,
      weakestCategory: weakest.category
    });
  };
  
  const filterSessions = () => {
    let filtered = [...sessions];
    
    // Filter by time period
    const now = new Date();
    const cutoff = new Date();
    switch (selectedPeriod) {
      case 'today':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'all':
      default:
        // No filtering needed
        break;
    }
    
    if (selectedPeriod !== 'all') {
      filtered = filtered.filter(s => new Date(s.date) >= cutoff);
    }
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(s => s.type === selectedType);
    }
    
    setFilteredSessions(filtered);
  };
  
  const exportHistory = () => {
    const csv = [
      ['Date', 'Type', 'Industry', 'Difficulty', 'Score', 'Duration', 'Questions'],
      ...filteredSessions.map(s => [
        new Date(s.date).toLocaleDateString(),
        s.type,
        s.industry,
        s.difficulty,
        s.overallScore,
        s.duration,
        s.questions.length
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text-primary mb-2">
            Practice History
          </h1>
          <p className="text-gray-700">
            Track your progress and review past sessions
          </p>
        </div>
        
        {/* Performance Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-500" />
              <span className="text-xs text-gray-500">Avg</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.averageScore}%
            </div>
            <p className="text-sm text-gray-600">Average Score</p>
            <div className="flex items-center mt-2">
              {getTrendIcon(stats.improvement)}
              <span className={`text-xs ml-1 ${
                stats.improvement > 0 ? 'text-green-600' : 
                stats.improvement < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {Math.abs(stats.improvement)}% vs last week
              </span>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-500" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
            </div>
            <p className="text-sm text-gray-600">Practice Time</p>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-green-500" />
              <span className="text-xs text-gray-500">Best</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.bestScore}%
            </div>
            <p className="text-sm text-gray-600">Best Score</p>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-yellow-500" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.questionsAnswered}
            </div>
            <p className="text-sm text-gray-600">Questions</p>
          </GlassCard>
        </div>
        
        {/* Insights */}
        <GlassCard className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Strongest Area</p>
                <p className="font-medium text-gray-900 capitalize">
                  {stats.strongestCategory || 'Behavioral'} Questions
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Needs Practice</p>
                <p className="font-medium text-gray-900 capitalize">
                  {stats.weakestCategory || 'Technical'} Questions
                </p>
              </div>
              <Target className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </GlassCard>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex space-x-2">
            {['today', 'week', 'month', 'all'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                  selectedPeriod === period
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 hover:bg-gray-50 font-semibold'
                }`}
              >
                {period === 'all' ? 'All Time' : `This ${period}`}
              </button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Types</option>
              <option value="practice">Practice</option>
              <option value="mock">Mock Interviews</option>
            </select>
            
            <Button variant="outline" onClick={exportHistory}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Sessions List */}
        <div className="space-y-4">
          {loading ? (
            <GlassCard className="p-12 text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
              </div>
            </GlassCard>
          ) : filteredSessions.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No practice sessions found for this period
              </p>
              <Button className="mt-4" onClick={() => window.location.href = '/practice'}>
                Start Practicing
              </Button>
            </GlassCard>
          ) : (
            filteredSessions.map((session) => (
              <GlassCard 
                key={session.id}
                className="p-6 hover:scale-[1.01] transition-all cursor-pointer"
                onClick={() => setExpandedSession(
                  expandedSession === session.id ? null : session.id
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">
                        {session.type === 'mock' ? 'Mock Interview' : 'Practice Session'}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize">
                        {session.industry}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                        {session.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(session.overallScore)}`}>
                      {session.overallScore}%
                    </div>
                    <p className="text-xs text-gray-600">
                      {session.duration} min • {session.questions.length} questions
                    </p>
                  </div>
                </div>
                
                {expandedSession === session.id && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Question Breakdown</h4>
                    <div className="space-y-2">
                      {session.questions.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{q.question}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-gray-500 capitalize">
                                {q.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.floor(q.timeSpent / 60)}:{(q.timeSpent % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${getScoreColor(q.score)}`}>
                            {q.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Review Full Session
                    </Button>
                  </div>
                )}
              </GlassCard>
            ))
          )}
        </div>
        
        {/* Performance Chart (Placeholder) */}
        <GlassCard className="p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Over Time</h2>
          <div className="h-48 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <p className="text-gray-500">
              Performance chart will show your score trends over time
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
