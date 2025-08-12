'use client'

import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { 
  CheckCircle, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  BarChart3,
  Star,
  ArrowRight,
  BookOpen,
  Zap,
  Award
} from '../../lib/icons';
import { CustomFeedback as FeedbackType, feedbackService } from '../../lib/ai/feedback-service';

interface CustomFeedbackProps {
  sessionId: string;
  responses: any[];
  userProfile: {
    industry: string;
    experienceLevel: string;
    targetRole: string;
  };
  onClose?: () => void;
}

export function CustomFeedback({ sessionId, responses, userProfile, onClose }: CustomFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'overview' | 'strengths' | 'improve' | 'tips' | 'progress'>('overview');

  useEffect(() => {
    generateFeedback();
  }, [sessionId]);

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const sessionAnalysis = {
        responses: responses.map(r => ({
          questionId: r.id || `q-${Math.random()}`,
          question: r.question || 'Sample question',
          userAnswer: r.answer || r.response || 'Sample response',
          category: r.category || 'behavioral',
          difficulty: r.difficulty || 'medium',
          timeSpent: r.timeSpent || 90,
          industry: userProfile.industry,
          role: userProfile.targetRole
        })),
        userProfile
      };

      const customFeedback = await feedbackService.generateCustomFeedback(sessionAnalysis);
      setFeedback(customFeedback);
    } catch (error) {
      console.error('Error generating feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <GlassCard className="p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Performance</h3>
          <p className="text-gray-700">AI is generating your personalized feedback...</p>
        </GlassCard>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'strengths', label: 'Strengths', icon: CheckCircle },
    { id: 'improve', label: 'Areas to Improve', icon: Target },
    { id: 'tips', label: 'Pro Tips', icon: Lightbulb },
    { id: 'progress', label: 'Your Progress', icon: TrendingUp }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Custom Feedback</h2>
                <p className="text-blue-100">AI-powered insights for {userProfile.targetRole}</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Overall Score */}
          <div className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Overall Performance</p>
              <p className="text-3xl font-bold">{feedback.overallScore}/100</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Trend</p>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span className="capitalize font-medium">{feedback.progressInsights.trend}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {currentTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(feedback.progressInsights.keyMetrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${getScoreColor(value)}`}>
                      {value}/10
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Session Summary</h4>
                <p className="text-gray-700">
                  You completed {responses.length} questions with strong performance in {userProfile.industry}. 
                  Your responses showed good {feedback.progressInsights.trend === 'improving' ? 'improvement and' : ''} 
                  alignment with {userProfile.targetRole} expectations.
                </p>
              </div>
            </div>
          )}

          {currentTab === 'strengths' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">Your Key Strengths</h3>
              </div>
              {feedback.strengths.map((strength, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-gray-800 font-medium">{strength}</p>
                </div>
              ))}
            </div>
          )}

          {currentTab === 'improve' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-semibold text-gray-900">Areas to Focus On</h3>
              </div>
              {feedback.areasToImprove.map((area, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-gray-800">{area}</p>
                </div>
              ))}
            </div>
          )}

          {currentTab === 'tips' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-semibold text-gray-900">Pro Tips for Next Time</h3>
              </div>
              {feedback.proTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-gray-800">{tip}</p>
                </div>
              ))}
            </div>
          )}

          {currentTab === 'progress' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Your Progress Journey</h3>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Recommendations for Your Next Session</h4>
                <div className="space-y-2">
                  {feedback.progressInsights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Study Focus</h4>
                  </div>
                  <p className="text-purple-800">
                    Continue practicing {userProfile.industry}-specific scenarios to build deeper expertise.
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Achievement Unlocked</h4>
                  </div>
                  <p className="text-green-800">
                    Strong {userProfile.experienceLevel} level performance! Keep building on this foundation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <p className="text-sm text-gray-600">
            Generated by AI • Personalized for {userProfile.industry} • {new Date().toLocaleDateString()}
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
              Start New Practice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}