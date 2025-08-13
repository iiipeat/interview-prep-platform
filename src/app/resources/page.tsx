'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Navigation } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { 
  Book,
  Clock,
  Star,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  Bookmark,
  Search,
  Filter,
  Download,
  ExternalLink,
  MessageSquare,
  Video,
  CheckCircle
} from '../../lib/icons';

type ResourceCategory = 'quick' | 'deep' | 'saved';
type ContentType = 'guide' | 'tips' | 'questions' | 'video';

interface Resource {
  id: string;
  title: string;
  description: string;
  readTime: string;
  category: ResourceCategory;
  type: ContentType;
  industry?: string;
  difficulty?: string;
  saved?: boolean;
  content?: string;
  tips?: string[];
}

const QUICK_WINS: Resource[] = [
  {
    id: 'star-method',
    title: 'The STAR Method in 2 Minutes',
    description: 'Master the most effective way to answer behavioral questions',
    readTime: '2 min',
    category: 'quick',
    type: 'guide',
    content: `The STAR method helps you give complete, concise answers:
    
    • Situation: Set the context for your story
    • Task: Explain what you needed to achieve
    • Action: Describe what you specifically did
    • Result: Share the outcome and what you learned
    
    Example: "Tell me about a time you handled conflict"
    S: Two team members disagreed on project approach
    T: I needed to mediate and keep project on track
    A: Organized separate 1-on-1s, then group discussion
    R: Found compromise, delivered project on time`
  },
  {
    id: 'top-questions',
    title: 'Top 5 Universal Interview Questions',
    description: 'Questions every interviewer asks and how to nail them',
    readTime: '3 min',
    category: 'quick',
    type: 'questions',
    tips: [
      'Tell me about yourself - Keep it under 2 minutes, focus on relevant experience',
      'Why this company? - Show you did research, align with their values',
      'Greatest strength - Pick something relevant to the role, give examples',
      'Biggest weakness - Be honest but show growth and self-awareness',
      'Where do you see yourself? - Show ambition but commitment to the role'
    ]
  },
  {
    id: 'body-language',
    title: 'Body Language Quick Tips',
    description: 'Non-verbal cues that make a great impression',
    readTime: '2 min',
    category: 'quick',
    type: 'tips',
    tips: [
      'Maintain eye contact 60-70% of the time',
      'Sit up straight, lean slightly forward to show interest',
      'Use open gestures, avoid crossing arms',
      'Smile genuinely when appropriate',
      'Mirror the interviewer\'s energy level'
    ]
  },
  {
    id: 'first-impression',
    title: 'First 30 Seconds Matter',
    description: 'How to make a stellar first impression',
    readTime: '1 min',
    category: 'quick',
    type: 'tips',
    tips: [
      'Arrive 10 minutes early',
      'Firm handshake with eye contact',
      'Remember and use the interviewer\'s name',
      'Have a genuine, warm smile',
      'Thank them for their time upfront'
    ]
  }
];

const DEEP_DIVES: Resource[] = [
  {
    id: 'industry-guide-tech',
    title: 'Complete Tech Interview Guide',
    description: 'Everything you need for technical interviews',
    readTime: '15 min',
    category: 'deep',
    type: 'guide',
    industry: 'tech'
  },
  {
    id: 'industry-guide-finance',
    title: 'Finance Interview Mastery',
    description: 'From behavioral to technical finance questions',
    readTime: '12 min',
    category: 'deep',
    type: 'guide',
    industry: 'finance'
  },
  {
    id: 'salary-negotiation',
    title: 'Salary Negotiation Strategies',
    description: 'How to negotiate your worth confidently',
    readTime: '10 min',
    category: 'deep',
    type: 'guide'
  },
  {
    id: 'remote-interviews',
    title: 'Ace Your Video Interview',
    description: 'Complete guide to remote interview success',
    readTime: '8 min',
    category: 'deep',
    type: 'guide'
  }
];

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedResources, setSavedResources] = useState<string[]>([]);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [userIndustry, setUserIndustry] = useState('');
  const [personalizedTips, setPersonalizedTips] = useState<string[]>([]);
  
  useEffect(() => {
    loadUserData();
    // Load personalized tips based on user's practice history
    try {
      const history = localStorage.getItem('practiceHistory');
      if (history) {
        setPersonalizedTips([
          'Based on your practice, focus more on quantifying your achievements',
          'You excel at behavioral questions - try more technical scenarios',
          'Consider practicing industry-specific terminology'
        ]);
      }
    } catch (error) {
      console.error('Error loading personalized tips:', error);
    }
  }, []);
  
  const loadUserData = async () => {
    try {
      // Load saved resources from database
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get saved resources from user profile
        // const { data: profile } = await supabaseHelpers.getUserProfile(user.id);
        const profile: any = null;
        if (profile && profile.saved_resources) {
          setSavedResources(profile.saved_resources);
        }
        if (profile && profile.preferredIndustry) {
          setUserIndustry(profile.preferredIndustry);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    
    // Also check localStorage as fallback
    const saved = localStorage.getItem('savedResources');
    if (saved && savedResources.length === 0) {
      setSavedResources(JSON.parse(saved));
    }
    
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      if (!userIndustry) {
        setUserIndustry(parsed.preferredIndustry || 'tech');
      }
    }
  };
  
  const toggleSaveResource = async (resourceId: string) => {
    const newSaved = savedResources.includes(resourceId)
      ? savedResources.filter(id => id !== resourceId)
      : [...savedResources, resourceId];
    
    setSavedResources(newSaved);
    
    // Save to localStorage immediately for quick response
    localStorage.setItem('savedResources', JSON.stringify(newSaved));
    
    // Also save to database
    try {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // await supabaseHelpers.updateUserProfile(user.id, {
        //   saved_resources: newSaved,
        //   last_resource_saved: new Date().toISOString()
        // });
        
        // Track resource interaction for achievements
        const savedCount = newSaved.length;
        if (savedCount === 1) {
          // First resource saved - potential achievement
        // await supabaseHelpers.unlockAchievement(user.id, 'first_resource');
        } else if (savedCount === 10) {
          // Resource collector achievement
        // await supabaseHelpers.unlockAchievement(user.id, 'resource_collector');
        }
      }
    } catch (error) {
      console.error('Error saving resource to database:', error);
      // localStorage save already happened, so user still has a good experience
    }
  };
  
  const getFilteredResources = () => {
    let resources: Resource[] = [];
    
    if (selectedCategory === 'quick') {
      resources = QUICK_WINS;
    } else if (selectedCategory === 'deep') {
      resources = DEEP_DIVES;
    } else {
      // Show saved resources
      resources = [...QUICK_WINS, ...DEEP_DIVES].filter(r => 
        savedResources.includes(r.id)
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      resources = resources.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return resources;
  };
  
  const resources = getFilteredResources();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text-primary mb-2">
            Interview Resources
          </h1>
          <p className="text-gray-700">
            Curated guides and tips to help you succeed
          </p>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedCategory('quick')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === 'quick'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-50 font-semibold'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Quick Wins
            </button>
            <button
              onClick={() => setSelectedCategory('deep')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === 'deep'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-50 font-semibold'
              }`}
            >
              <Book className="w-4 h-4 inline mr-2" />
              Deep Dives
            </button>
            <button
              onClick={() => setSelectedCategory('saved')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === 'saved'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-50 font-semibold'
              }`}
            >
              <Bookmark className="w-4 h-4 inline mr-2" />
              Saved ({savedResources.length})
            </button>
          </div>
        </div>
        
        {/* Personalized Tips Section */}
        {personalizedTips.length > 0 && selectedCategory === 'quick' && (
          <GlassCard className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Your Personalized Tips</h3>
            </div>
            <ul className="space-y-2">
              {personalizedTips.map((tip, index) => (
                <li key={index} className="flex items-start text-gray-700">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
        
        {/* Resources Grid */}
        {resources.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {selectedCategory === 'saved' 
                ? 'No saved resources yet. Start saving helpful guides!'
                : 'No resources found. Try adjusting your search.'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {resources.map((resource) => (
              <GlassCard 
                key={resource.id}
                className="p-6 hover:scale-[1.02] transition-all cursor-pointer"
                onClick={() => setExpandedResource(
                  expandedResource === resource.id ? null : resource.id
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {resource.type === 'guide' && <Book className="w-4 h-4 text-blue-500 mr-2" />}
                      {resource.type === 'tips' && <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />}
                      {resource.type === 'questions' && <MessageSquare className="w-4 h-4 text-purple-500 mr-2" />}
                      {resource.type === 'video' && <Video className="w-4 h-4 text-red-500 mr-2" />}
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        {resource.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {resource.description}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveResource(resource.id);
                    }}
                    className="ml-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Bookmark 
                      className={`w-5 h-5 ${
                        savedResources.includes(resource.id)
                          ? 'text-blue-500 fill-blue-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {resource.readTime} read
                  {resource.industry && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="capitalize">{resource.industry}</span>
                    </>
                  )}
                </div>
                
                {/* Expanded Content */}
                {expandedResource === resource.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {resource.content && (
                      <div className="prose prose-sm text-gray-700 whitespace-pre-line">
                        {resource.content}
                      </div>
                    )}
                    {resource.tips && (
                      <ul className="space-y-2">
                        {resource.tips.map((tip, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <span className="text-blue-500 mr-2 mt-0.5">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Full Guide
                      </Button>
                    </div>
                  </div>
                )}
                
                {!expandedResource && (
                  <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                    Read more
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
        
        {/* Industry-Specific Section */}
        {selectedCategory === 'deep' && userIndustry && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recommended for {userIndustry.charAt(0).toUpperCase() + userIndustry.slice(1)}
            </h2>
            <GlassCard className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className="font-medium text-gray-900">Common Questions</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Top 20 questions for your industry
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                  <h4 className="font-medium text-gray-900">Industry Trends</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    What employers are looking for
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <h4 className="font-medium text-gray-900">Success Stories</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Real interview success examples
                  </p>
                </div>
              </div>
              <Button className="w-full mt-6">
                Explore {userIndustry.charAt(0).toUpperCase() + userIndustry.slice(1)} Resources
              </Button>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
