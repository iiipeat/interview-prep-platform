'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { 
  Trophy, Target, Zap, Star, Award, TrendingUp, 
  Calendar, Clock, Users, BookOpen, Flame, Medal
} from '../../lib/icons';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  category: 'streak' | 'performance' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalQuestions: number;
  perfectSessions: number;
  practiceHours: number;
  buddySessions: number;
}

const ACHIEVEMENTS_DATA: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Streak Achievements
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Complete your first practice session',
    icon: Star,
    maxProgress: 1,
    category: 'milestone',
    rarity: 'common',
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Practice for 7 days in a row',
    icon: Flame,
    maxProgress: 7,
    category: 'streak',
    rarity: 'common',
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Practice for 30 days in a row',
    icon: Calendar,
    maxProgress: 30,
    category: 'streak',
    rarity: 'epic',
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Practice for 100 days in a row',
    icon: Trophy,
    maxProgress: 100,
    category: 'streak',
    rarity: 'legendary',
  },
  // Performance Achievements
  {
    id: 'perfect-session',
    name: 'Perfect Session',
    description: 'Complete a session with 100% correct answers',
    icon: Award,
    maxProgress: 1,
    category: 'performance',
    rarity: 'rare',
  },
  {
    id: 'quick-thinker',
    name: 'Quick Thinker',
    description: 'Answer 10 questions in under 1 minute each',
    icon: Zap,
    maxProgress: 10,
    category: 'performance',
    rarity: 'rare',
  },
  {
    id: 'improvement-guru',
    name: 'Improvement Guru',
    description: 'Increase difficulty level 5 times',
    icon: TrendingUp,
    maxProgress: 5,
    category: 'performance',
    rarity: 'epic',
  },
  // Social Achievements
  {
    id: 'buddy-up',
    name: 'Buddy Up',
    description: 'Complete your first practice buddy session',
    icon: Users,
    maxProgress: 1,
    category: 'social',
    rarity: 'common',
  },
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Complete 10 practice buddy sessions',
    icon: Users,
    maxProgress: 10,
    category: 'social',
    rarity: 'rare',
  },
  // Milestone Achievements
  {
    id: 'question-explorer',
    name: 'Question Explorer',
    description: 'Answer 100 questions',
    icon: Target,
    maxProgress: 100,
    category: 'milestone',
    rarity: 'common',
  },
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Practice for 10 hours total',
    icon: Clock,
    maxProgress: 10,
    category: 'milestone',
    rarity: 'rare',
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Answer 1000 questions',
    icon: BookOpen,
    maxProgress: 1000,
    category: 'milestone',
    rarity: 'epic',
  },
];

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600',
};

const rarityBgColors = {
  common: 'bg-gray-100',
  rare: 'bg-blue-100',
  epic: 'bg-purple-100',
  legendary: 'bg-gradient-to-br from-yellow-100 to-orange-100',
};

export const AchievementSystem: React.FC<{ userStats: UserStats }> = ({ userStats }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnlocked, setShowUnlocked] = useState(false);

  useEffect(() => {
    // Calculate progress for each achievement based on user stats
    const updatedAchievements = ACHIEVEMENTS_DATA.map(achievement => {
      let progress = 0;
      let unlocked = false;

      // Calculate progress based on achievement ID
      switch (achievement.id) {
        case 'first-step':
          progress = userStats.totalQuestions > 0 ? 1 : 0;
          break;
        case 'week-warrior':
          progress = Math.min(userStats.currentStreak, 7);
          break;
        case 'monthly-master':
          progress = Math.min(userStats.currentStreak, 30);
          break;
        case 'century-club':
          progress = Math.min(userStats.currentStreak, 100);
          break;
        case 'perfect-session':
          progress = Math.min(userStats.perfectSessions, 1);
          break;
        case 'buddy-up':
          progress = userStats.buddySessions > 0 ? 1 : 0;
          break;
        case 'team-player':
          progress = Math.min(userStats.buddySessions, 10);
          break;
        case 'question-explorer':
          progress = Math.min(userStats.totalQuestions, 100);
          break;
        case 'dedicated-learner':
          progress = Math.min(userStats.practiceHours, 10);
          break;
        case 'knowledge-seeker':
          progress = Math.min(userStats.totalQuestions, 1000);
          break;
        default:
          progress = 0;
      }

      unlocked = progress >= achievement.maxProgress;

      return {
        ...achievement,
        progress,
        unlocked,
        unlockedAt: unlocked ? new Date() : undefined,
      };
    });

    setAchievements(updatedAchievements);
  }, [userStats]);

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    if (showUnlocked && !achievement.unlocked) {
      return false;
    }
    return true;
  });

  const categories = ['all', 'streak', 'performance', 'social', 'milestone'];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <GlassCard className="p-6">
        <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{userStats.currentStreak}</p>
            <p className="text-sm text-gray-600">Day Streak</p>
          </div>
          <div className="text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{userStats.totalQuestions}</p>
            <p className="text-sm text-gray-600">Questions</p>
          </div>
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{userStats.practiceHours}h</p>
            <p className="text-sm text-gray-600">Practice Time</p>
          </div>
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </p>
            <p className="text-sm text-gray-600">Achievements</p>
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-white/50 backdrop-blur-sm hover:bg-white/70'
            }`}
          >
            {category}
          </button>
        ))}
        <div className="ml-auto">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnlocked}
              onChange={(e) => setShowUnlocked(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show unlocked only</span>
          </label>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const Icon = achievement.icon;
          const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

          return (
            <GlassCard
              key={achievement.id}
              className={`p-4 transition-all ${
                achievement.unlocked ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-3 rounded-lg ${
                    achievement.unlocked
                      ? `bg-gradient-to-br ${rarityColors[achievement.rarity]}`
                      : 'bg-gray-200'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      achievement.unlocked ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{achievement.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          achievement.unlocked
                            ? `bg-gradient-to-r ${rarityColors[achievement.rarity]}`
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Rarity Badge */}
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        rarityBgColors[achievement.rarity]
                      } ${
                        achievement.unlocked
                          ? `text-${achievement.rarity === 'legendary' ? 'orange' : achievement.rarity}-700`
                          : 'text-gray-500'
                      }`}
                    >
                      {achievement.rarity}
                    </span>
                  </div>

                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Unlocked {achievement.unlockedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Motivational Message */}
      {achievements.filter(a => !a.unlocked).length > 0 && (
        <GlassCard className="p-6 text-center bg-gradient-to-br from-blue-50 to-purple-50">
          <Medal className="w-12 h-12 mx-auto mb-3 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">Keep Going!</h3>
          <p className="text-gray-600">
            You have {achievements.filter(a => !a.unlocked).length} achievements left to unlock.
            Your next achievement is just around the corner!
          </p>
        </GlassCard>
      )}
    </div>
  );
};

export default AchievementSystem;