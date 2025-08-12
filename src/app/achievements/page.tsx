'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Navigation } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { 
  Trophy,
  Target,
  Zap,
  Star,
  TrendingUp,
  Award,
  Lock,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Briefcase,
  Heart,
  Flame,
  Share2
} from '@/lib/icons';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'consistency' | 'performance' | 'exploration' | 'milestone';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Stats {
  totalUnlocked: number;
  totalAchievements: number;
  currentStreak: number;
  bestStreak: number;
  totalQuestions: number;
  perfectScores: number;
}

const ACHIEVEMENTS_DATA: Achievement[] = [
  // Consistency Category
  {
    id: 'first-step',
    title: 'First Steps',
    description: 'Complete your first practice question',
    icon: <Star className="w-6 h-6" />,
    category: 'consistency',
    unlocked: true,
    progress: 1,
    maxProgress: 1,
    unlockedDate: '2024-01-15',
    rarity: 'common'
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Practice for 7 days in a row',
    icon: <Flame className="w-6 h-6" />,
    category: 'consistency',
    unlocked: true,
    progress: 7,
    maxProgress: 7,
    unlockedDate: '2024-01-22',
    rarity: 'rare'
  },
  {
    id: 'commitment',
    title: 'Committed',
    description: 'Practice for 30 days in a row',
    icon: <Trophy className="w-6 h-6" />,
    category: 'consistency',
    unlocked: false,
    progress: 12,
    maxProgress: 30,
    rarity: 'epic'
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Answer 100 questions total',
    icon: <Target className="w-6 h-6" />,
    category: 'consistency',
    unlocked: false,
    progress: 47,
    maxProgress: 100,
    rarity: 'rare'
  },
  
  // Performance Category
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Score 100% on any question',
    icon: <CheckCircle className="w-6 h-6" />,
    category: 'performance',
    unlocked: true,
    progress: 1,
    maxProgress: 1,
    unlockedDate: '2024-01-20',
    rarity: 'common'
  },
  {
    id: 'high-achiever',
    title: 'High Achiever',
    description: 'Score above 90% five times',
    icon: <TrendingUp className="w-6 h-6" />,
    category: 'performance',
    unlocked: false,
    progress: 3,
    maxProgress: 5,
    rarity: 'rare'
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 10 questions under time limit',
    icon: <Zap className="w-6 h-6" />,
    category: 'performance',
    unlocked: false,
    progress: 6,
    maxProgress: 10,
    rarity: 'rare'
  },
  {
    id: 'interview-ace',
    title: 'Interview Ace',
    description: 'Complete a mock interview with 85%+ score',
    icon: <Award className="w-6 h-6" />,
    category: 'performance',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: 'epic'
  },
  
  // Exploration Category
  {
    id: 'industry-explorer',
    title: 'Industry Explorer',
    description: 'Practice questions from 5 different industries',
    icon: <Briefcase className="w-6 h-6" />,
    category: 'exploration',
    unlocked: false,
    progress: 2,
    maxProgress: 5,
    rarity: 'rare'
  },
  {
    id: 'well-rounded',
    title: 'Well Rounded',
    description: 'Answer all question types (behavioral, technical, situational, cultural)',
    icon: <BookOpen className="w-6 h-6" />,
    category: 'exploration',
    unlocked: true,
    progress: 4,
    maxProgress: 4,
    unlockedDate: '2024-01-18',
    rarity: 'common'
  },
  {
    id: 'buddy-system',
    title: 'Buddy System',
    description: 'Complete a practice buddy session',
    icon: <Users className="w-6 h-6" />,
    category: 'exploration',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: 'rare'
  },
  {
    id: 'resource-reader',
    title: 'Knowledge Seeker',
    description: 'Read 10 resource articles',
    icon: <BookOpen className="w-6 h-6" />,
    category: 'exploration',
    unlocked: false,
    progress: 4,
    maxProgress: 10,
    rarity: 'common'
  },
  
  // Milestone Category
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Practice before 7 AM',
    icon: <Clock className="w-6 h-6" />,
    category: 'milestone',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: 'common'
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Practice after 10 PM',
    icon: <Clock className="w-6 h-6" />,
    category: 'milestone',
    unlocked: true,
    progress: 1,
    maxProgress: 1,
    unlockedDate: '2024-01-19',
    rarity: 'common'
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Practice on both Saturday and Sunday',
    icon: <Heart className="w-6 h-6" />,
    category: 'milestone',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: 'common'
  }
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState<Stats>({
    totalUnlocked: 0,
    totalAchievements: ACHIEVEMENTS_DATA.length,
    currentStreak: 0,
    bestStreak: 0,
    totalQuestions: 0,
    perfectScores: 0
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadUserAchievements();
  }, []);
  
  const loadUserAchievements = async () => {
    try {
      // Get user data from database
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user stats
        const { data: userStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // Get unlocked achievements
        const { data: unlockedAchievements } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id);
        
        // Update achievements based on actual user data
        updateAchievements(userStats, unlockedAchievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
    
    // Also check localStorage for quick data
    const userProfile = localStorage.getItem('userProfile');
    const practiceSessions = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
    const userResponses = JSON.parse(localStorage.getItem('userResponses') || '[]');
    
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      
      // Calculate real stats from localStorage
      const questionsCount = practiceSessions.length;
      const perfectScoreCount = userResponses.filter((r: any) => {
        const feedback = typeof r.feedback === 'string' ? JSON.parse(r.feedback) : r.feedback;
        return feedback?.score >= 95;
      }).length;
      
      const currentStreak = profile.currentStreak || 0;
      const bestStreak = profile.bestStreak || currentStreak;
      
      // Check achievements based on real data
      const updatedAchievements = ACHIEVEMENTS_DATA.map(achievement => {
        const updated = { ...achievement };
        
        // Check if achievement should be unlocked
        switch (achievement.id) {
          case 'first-step':
            if (questionsCount > 0) {
              updated.unlocked = true;
              updated.progress = 1;
              updated.unlockedDate = practiceSessions[0]?.created_at || new Date().toISOString();
            }
            break;
            
          case 'week-warrior':
            if (currentStreak >= 7 || bestStreak >= 7) {
              updated.unlocked = true;
              updated.progress = 7;
            } else {
              updated.progress = Math.min(currentStreak, 7);
            }
            break;
            
          case 'commitment':
            updated.progress = Math.min(bestStreak, 30);
            if (bestStreak >= 30) {
              updated.unlocked = true;
            }
            break;
            
          case 'centurion':
            updated.progress = questionsCount;
            if (questionsCount >= 100) {
              updated.unlocked = true;
            }
            break;
            
          case 'perfect-score':
            if (perfectScoreCount > 0) {
              updated.unlocked = true;
              updated.progress = 1;
            }
            break;
            
          case 'high-achiever':
            updated.progress = Math.min(perfectScoreCount, 5);
            if (perfectScoreCount >= 5) {
              updated.unlocked = true;
            }
            break;
            
          case 'well-rounded':
            // Check if user has answered all question types
            const questionTypes = new Set(practiceSessions.map((s: any) => s.question_type));
            updated.progress = questionTypes.size;
            if (questionTypes.size >= 4) {
              updated.unlocked = true;
            }
            break;
            
          case 'resource-reader':
            const savedResources = JSON.parse(localStorage.getItem('savedResources') || '[]');
            updated.progress = Math.min(savedResources.length, 10);
            if (savedResources.length >= 10) {
              updated.unlocked = true;
            }
            break;
        }
        
        return updated;
      });
      
      setAchievements(updatedAchievements);
      
      // Update stats
      const totalUnlocked = updatedAchievements.filter(a => a.unlocked).length;
      setStats({
        totalUnlocked,
        totalAchievements: ACHIEVEMENTS_DATA.length,
        currentStreak: currentStreak,
        bestStreak: bestStreak,
        totalQuestions: questionsCount,
        perfectScores: perfectScoreCount
      });
    }
    
    setLoading(false);
  };
  
  const updateAchievements = (userStats: any, unlockedAchievements: any) => {
    // Update achievements based on database data
    if (!userStats) return;
    
    // This would check actual user progress and unlock achievements accordingly
    // For now, integrating with localStorage data above
  };
  
  const getFilteredAchievements = () => {
    if (selectedCategory === 'all') return achievements;
    if (selectedCategory === 'unlocked') return achievements.filter(a => a.unlocked);
    return achievements.filter(a => a.category === selectedCategory);
  };
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-500';
      case 'rare': return 'text-blue-500';
      case 'epic': return 'text-purple-500';
      case 'legendary': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };
  
  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100';
      case 'rare': return 'bg-blue-100';
      case 'epic': return 'bg-purple-100';
      case 'legendary': return 'bg-yellow-100';
      default: return 'bg-gray-100';
    }
  };
  
  const shareAchievement = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowShareModal(true);
  };
  
  const calculateOverallProgress = () => {
    const totalProgress = achievements.reduce((sum, a) => sum + a.progress, 0);
    const totalMax = achievements.reduce((sum, a) => sum + a.maxProgress, 0);
    return Math.round((totalProgress / totalMax) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text-primary mb-2">
            Your Achievements
          </h1>
          <p className="text-gray-700">
            Track your progress and celebrate your milestones
          </p>
        </div>
        
        {/* Overall Progress */}
        <GlassCard className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Overall Progress</h2>
            <span className="text-2xl font-bold gradient-text-primary">
              {calculateOverallProgress()}%
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${calculateOverallProgress()}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalUnlocked}/{stats.totalAchievements}
              </div>
              <p className="text-sm text-gray-600">Unlocked</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.currentStreak}
              </div>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalQuestions}
              </div>
              <p className="text-sm text-gray-600">Questions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.perfectScores}
              </div>
              <p className="text-sm text-gray-600">Perfect Scores</p>
            </div>
          </div>
        </GlassCard>
        
        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'unlocked', 'consistency', 'performance', 'exploration', 'milestone'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-50 font-semibold'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Achievements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getFilteredAchievements().map((achievement) => (
            <GlassCard 
              key={achievement.id}
              className={`p-6 transition-all ${
                achievement.unlocked 
                  ? 'hover:scale-[1.02] cursor-pointer' 
                  : 'opacity-75'
              }`}
              onClick={() => achievement.unlocked && shareAchievement(achievement)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-lg ${
                  achievement.unlocked 
                    ? getRarityBg(achievement.rarity)
                    : 'bg-gray-100'
                }`}>
                  <div className={
                    achievement.unlocked 
                      ? getRarityColor(achievement.rarity)
                      : 'text-gray-400'
                  }>
                    {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
                  </div>
                </div>
                {achievement.unlocked && (
                  <Share2 className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
                )}
              </div>
              
              <h3 className={`font-semibold mb-1 ${
                achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {achievement.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {achievement.description}
              </p>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : 'bg-gradient-to-r from-blue-400 to-purple-400'
                    }`}
                    style={{ 
                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                    }}
                  />
                </div>
              </div>
              
              {/* Unlocked Date or Rarity */}
              <div className="text-xs text-gray-500">
                {achievement.unlocked && achievement.unlockedDate ? (
                  <>Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}</>
                ) : (
                  <span className={`capitalize ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity}
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
        
        {/* Upcoming Achievements */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Almost There! 🎯
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {achievements
              .filter(a => !a.unlocked && a.progress / a.maxProgress >= 0.5)
              .slice(0, 4)
              .map((achievement) => (
                <GlassCard key={achievement.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        {achievement.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">
                          {achievement.maxProgress - achievement.progress} more to go!
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-500">
                      {Math.round((achievement.progress / achievement.maxProgress) * 100)}%
                    </div>
                  </div>
                </GlassCard>
              ))}
          </div>
        </div>
        
        {/* Share Modal */}
        {showShareModal && selectedAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <GlassCard className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Share Achievement
              </h3>
              <div className="text-center mb-6">
                <div className={`inline-flex p-4 rounded-lg mb-3 ${
                  getRarityBg(selectedAchievement.rarity)
                }`}>
                  <div className={getRarityColor(selectedAchievement.rarity)}>
                    {selectedAchievement.icon}
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900">
                  {selectedAchievement.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAchievement.description}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowShareModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Share functionality
                    alert('Achievement shared!');
                    setShowShareModal(false);
                  }}
                  className="flex-1"
                >
                  Share
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}