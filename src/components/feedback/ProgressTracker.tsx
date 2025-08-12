'use client'

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  TrendingUp, 
  Minus,
  BarChart3,
  Target,
  Star,
  Calendar,
  Zap
} from '@/lib/icons';

interface ProgressMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  unit?: string;
}

interface ProgressData {
  overallScore: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  metrics: ProgressMetric[];
  streakDays: number;
  totalSessions: number;
  improvements: string[];
  nextGoals: string[];
}

export function ProgressTracker({ userId }: { userId: string }) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [userId]);

  const loadProgressData = async () => {
    setLoading(true);
    
    // Mock data - in production this would come from your database and AI analysis
    setTimeout(() => {
      setProgressData({
        overallScore: {
          current: 78,
          trend: 'up',
          change: 12
        },
        metrics: [
          { name: 'Communication Clarity', current: 8.5, previous: 7.2, target: 9.0 },
          { name: 'Technical Accuracy', current: 7.8, previous: 8.1, target: 8.5, unit: '/10' },
          { name: 'Structured Thinking', current: 8.2, previous: 7.5, target: 9.0 },
          { name: 'Confidence Level', current: 7.9, previous: 7.9, target: 8.5 }
        ],
        streakDays: 5,
        totalSessions: 12,
        improvements: [
          'Responses are now 25% more structured using STAR method',
          'Technical explanations show 30% improvement in clarity',
          'Reduced average response time by 15 seconds while maintaining quality'
        ],
        nextGoals: [
          'Master behavioral questions for leadership scenarios',
          'Practice industry-specific case studies',
          'Improve quantified storytelling with metrics'
        ]
      });
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!progressData) {
    return null;
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <Minus className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Your Progress</h3>
              <p className="text-gray-600">AI-powered insights and tracking</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-gray-900">{progressData.overallScore.current}</span>
              <div className={`flex items-center space-x-1 ${
                progressData.overallScore.trend === 'up' ? 'text-green-600' : 
                progressData.overallScore.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {progressData.overallScore.trend === 'up' && <TrendingUp className="w-5 h-5" />}
                {progressData.overallScore.trend === 'down' && <Minus className="w-5 h-5" />}
                {progressData.overallScore.trend === 'stable' && <Minus className="w-5 h-5" />}
                <span className="font-medium">+{progressData.overallScore.change}</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Overall Score</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 font-semibold">{progressData.streakDays} Day Streak</span>
            </div>
            <p className="text-orange-600 text-sm mt-1">Keep it going!</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800 font-semibold">{progressData.totalSessions} Sessions</span>
            </div>
            <p className="text-purple-600 text-sm mt-1">Total completed</p>
          </div>
        </div>
      </GlassCard>

      {/* Detailed Metrics */}
      <GlassCard className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
        <div className="space-y-4">
          {progressData.metrics.map((metric, index) => {
            const progressPercentage = (metric.current / 10) * 100;
            const change = metric.current - metric.previous;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{metric.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      {metric.current}{metric.unit || '/10'}
                    </span>
                    <div className={`flex items-center space-x-1 text-sm ${getTrendColor(metric.current, metric.previous)}`}>
                      {getTrendIcon(metric.current, metric.previous)}
                      <span>{change > 0 ? '+' : ''}{change.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Previous: {metric.previous}/10</span>
                  <span>Target: {metric.target}/10</span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recent Improvements */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-green-600" />
          <h4 className="text-lg font-semibold text-gray-900">Recent Improvements</h4>
        </div>
        <div className="space-y-3">
          {progressData.improvements.map((improvement, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">{improvement}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Next Goals */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-gray-900">Your Next Goals</h4>
        </div>
        <div className="space-y-3">
          {progressData.nextGoals.map((goal, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
              </div>
              <p className="text-gray-800">{goal}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}