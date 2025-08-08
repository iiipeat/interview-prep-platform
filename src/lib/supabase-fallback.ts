// Fallback implementation when Supabase is not available
// This allows the app to work with localStorage while real DB is not configured

export const supabaseHelpers = {
  async signUp(email: string, password: string, metadata?: any) {
    // Mock signup - save to localStorage
    const user = {
      id: Math.random().toString(36),
      email,
      ...metadata,
      created_at: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    
    return { data: { user }, error: null };
  },

  async signIn(email: string, password: string) {
    // Mock signin - check localStorage
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = savedUsers.find((u: any) => u.email === email);
    
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
      return { data: { user }, error: null };
    }
    
    return { data: null, error: { message: 'Invalid credentials' } };
  },

  async signInWithGoogle() {
    // Mock Google signin
    const user = {
      id: Math.random().toString(36),
      email: 'user@gmail.com',
      name: 'Google User',
      provider: 'google',
      created_at: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    
    // Would normally redirect to Google
    return { data: { user }, error: null };
  },

  async signOut() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    return { error: null };
  },

  async getUser() {
    const isAuth = localStorage.getItem('isAuthenticated');
    const userStr = localStorage.getItem('currentUser');
    
    if (isAuth && userStr) {
      return { user: JSON.parse(userStr), error: null };
    }
    
    return { user: null, error: null };
  },

  async getUserProfile(userId: string) {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      return { data: JSON.parse(profile), error: null };
    }
    return { data: null, error: null };
  },

  async updateUserProfile(userId: string, updates: any) {
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const updated = { ...profile, ...updates };
    localStorage.setItem('userProfile', JSON.stringify(updated));
    return { data: updated, error: null };
  },

  async getUserSubscription(userId: string) {
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    return {
      data: {
        status: profile.subscriptionStatus || 'trial',
        trial_ends_at: profile.trialEndDate
      },
      error: null
    };
  },

  async createPracticeSession(sessionData: any) {
    const sessions = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
    const newSession = {
      ...sessionData,
      id: Math.random().toString(36),
      created_at: new Date().toISOString()
    };
    sessions.push(newSession);
    localStorage.setItem('practiceSessions', JSON.stringify(sessions));
    localStorage.setItem('currentSession', JSON.stringify(newSession));
    return { data: newSession, error: null };
  },

  async getUserSessions(userId: string, limit = 10) {
    const sessions = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
    return { data: sessions.slice(-limit).reverse(), error: null };
  },

  async getQuestions(filters: any = {}) {
    // Mock questions based on filters
    const questions = [
      {
        id: '1',
        question: 'Tell me about yourself',
        type: 'behavioral',
        difficulty: 'easy',
        industry: filters.industry || 'general'
      },
      {
        id: '2', 
        question: 'Why do you want to work here?',
        type: 'cultural',
        difficulty: 'medium',
        industry: filters.industry || 'general'
      },
      {
        id: '3',
        question: 'Describe a challenging situation you overcame',
        type: 'behavioral',
        difficulty: 'medium',
        industry: filters.industry || 'general'
      }
    ];
    
    return { data: questions, error: null };
  },

  async saveUserResponse(responseData: any) {
    const responses = JSON.parse(localStorage.getItem('userResponses') || '[]');
    const newResponse = {
      ...responseData,
      id: Math.random().toString(36),
      created_at: new Date().toISOString()
    };
    responses.push(newResponse);
    localStorage.setItem('userResponses', JSON.stringify(responses));
    
    // Update current session
    const currentSession = JSON.parse(localStorage.getItem('currentSession') || '{}');
    currentSession.response = newResponse;
    localStorage.setItem('currentSession', JSON.stringify(currentSession));
    
    return { data: newResponse, error: null };
  },

  async getUserAchievements(userId: string) {
    const achievements = JSON.parse(localStorage.getItem('userAchievements') || '[]');
    return { data: achievements, error: null };
  },

  async unlockAchievement(userId: string, achievementId: string) {
    const achievements = JSON.parse(localStorage.getItem('userAchievements') || '[]');
    const newAchievement = {
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString()
    };
    achievements.push(newAchievement);
    localStorage.setItem('userAchievements', JSON.stringify(achievements));
    return { data: newAchievement, error: null };
  },

  async getUserStats(userId: string) {
    const stats = localStorage.getItem('userStats');
    if (stats) {
      return { data: JSON.parse(stats), error: null };
    }
    
    // Default stats
    return {
      data: {
        total_questions: 0,
        average_score: 0,
        best_score: 0,
        current_streak: 0,
        best_streak: 0,
        achievements_unlocked: 0
      },
      error: null
    };
  },

  async updateUserStats(userId: string, updates: any) {
    const stats = JSON.parse(localStorage.getItem('userStats') || '{}');
    
    // Handle increments
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && updates[key].increment) {
        stats[key] = (stats[key] || 0) + updates[key].increment;
      } else {
        stats[key] = updates[key];
      }
    });
    
    localStorage.setItem('userStats', JSON.stringify(stats));
    return { data: stats, error: null };
  }
};

// Export for compatibility
export default supabaseHelpers;