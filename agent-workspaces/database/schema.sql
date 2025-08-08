-- Interview Prep Platform Database Schema
-- PostgreSQL with Supabase
-- Created: 2025-08-08
-- Agent: Diana (Database Agent)

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- AUTHENTICATION & USER MANAGEMENT
-- =============================================

-- Users table - Core authentication data
-- Supabase auth.users is handled automatically, this extends it
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'github'
    provider_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles - Extended user information
CREATE TABLE public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    current_role VARCHAR(255),
    target_role VARCHAR(255),
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'executive')),
    industry VARCHAR(255),
    skills TEXT[], -- Array of skills
    career_goals TEXT,
    location VARCHAR(255),
    timezone VARCHAR(50),
    preferred_difficulty VARCHAR(20) CHECK (preferred_difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- SUBSCRIPTION MANAGEMENT
-- =============================================

-- Subscription plans
CREATE TABLE public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly INTEGER, -- in cents, null for free
    price_weekly INTEGER, -- in cents, null for free
    features JSONB NOT NULL DEFAULT '{}',
    max_sessions_per_day INTEGER,
    max_questions_per_session INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status VARCHAR(20) CHECK (status IN ('trial', 'active', 'canceled', 'expired', 'past_due')),
    trial_start_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, plan_id)
);

-- =============================================
-- QUESTION MANAGEMENT & CACHING
-- =============================================

-- Question categories and types
CREATE TABLE public.question_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cached AI-generated questions to reduce API calls
CREATE TABLE public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.question_categories(id),
    question_type VARCHAR(50) CHECK (question_type IN ('behavioral', 'technical', 'situational', 'case_study')),
    role VARCHAR(255), -- Target role for this question
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'executive')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    title VARCHAR(500) NOT NULL,
    question_text TEXT NOT NULL,
    context TEXT, -- Additional context or scenario
    sample_answer TEXT,
    evaluation_criteria JSONB, -- Key points to look for in answers
    tags TEXT[], -- Array of tags for filtering
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00, -- Average user rating
    is_verified BOOLEAN DEFAULT false, -- Manually reviewed and approved
    created_by UUID REFERENCES public.users(id), -- Admin who created/imported
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PRACTICE SESSIONS
-- =============================================

-- Practice sessions
CREATE TABLE public.practice_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) CHECK (session_type IN ('quick', 'full', 'custom', 'mock_interview')),
    target_role VARCHAR(255),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    duration_minutes INTEGER,
    status VARCHAR(20) CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    total_questions INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    overall_score DECIMAL(5,2),
    feedback_summary TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User responses to questions
CREATE TABLE public.user_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    response_text TEXT,
    response_audio_url TEXT, -- For voice responses
    response_duration_seconds INTEGER,
    ai_score DECIMAL(5,2), -- AI-generated score (0-100)
    ai_feedback TEXT,
    strengths TEXT[],
    improvements TEXT[],
    question_rating INTEGER CHECK (question_rating >= 1 AND question_rating <= 5), -- User rates the question
    response_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS & PROGRESS TRACKING
-- =============================================

-- User progress tracking
CREATE TABLE public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL, -- 'sessions_completed', 'avg_score', 'streak_days', etc.
    metric_value DECIMAL(10,2),
    metric_data JSONB, -- Additional data for complex metrics
    date_recorded DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, metric_name, date_recorded)
);

-- Daily usage analytics
CREATE TABLE public.analytics_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, metric_name)
);

-- User achievements and milestones
CREATE TABLE public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL, -- 'first_session', 'week_streak', '100_questions', etc.
    achievement_name VARCHAR(255),
    description TEXT,
    icon_name VARCHAR(100),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_type)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users and profiles
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_provider ON public.users(provider, provider_id);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_experience ON public.user_profiles(experience_level);

-- Subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);

-- Questions and caching
CREATE INDEX idx_questions_category ON public.questions(category_id);
CREATE INDEX idx_questions_type_role ON public.questions(question_type, role);
CREATE INDEX idx_questions_difficulty_level ON public.questions(difficulty, experience_level);
CREATE INDEX idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX idx_questions_usage_count ON public.questions(usage_count DESC);
CREATE INDEX idx_questions_rating ON public.questions(rating DESC);

-- Practice sessions
CREATE INDEX idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_status ON public.practice_sessions(status);
CREATE INDEX idx_practice_sessions_started_at ON public.practice_sessions(started_at DESC);

-- User responses
CREATE INDEX idx_user_responses_session_id ON public.user_responses(session_id);
CREATE INDEX idx_user_responses_user_id ON public.user_responses(user_id);
CREATE INDEX idx_user_responses_question_id ON public.user_responses(question_id);
CREATE INDEX idx_user_responses_created_at ON public.user_responses(created_at DESC);

-- Analytics
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_date ON public.user_progress(date_recorded DESC);
CREATE INDEX idx_user_progress_metric ON public.user_progress(metric_name, date_recorded DESC);
CREATE INDEX idx_analytics_daily_date ON public.analytics_daily(date DESC);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON public.user_achievements(achievement_type);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own user_profiles" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sessions" ON public.practice_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own responses" ON public.user_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own progress" ON public.user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR ALL USING (auth.uid() = user_id);

-- Questions and categories are publicly readable (no user-specific data)
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are publicly readable" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Question categories are publicly readable" ON public.question_categories FOR SELECT TO authenticated USING (true);

-- Subscription plans are publicly readable
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscription plans are publicly readable" ON public.subscription_plans FOR SELECT TO authenticated USING (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON public.practice_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_responses_updated_at BEFORE UPDATE ON public.user_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA SEEDING
-- =============================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_weekly, features, max_sessions_per_day, max_questions_per_session) VALUES
('Free Trial', '7-day free trial with limited access', null, null, '{"trial_period": 7, "ai_feedback": true, "basic_analytics": true}', 2, 5),
('Weekly Premium', 'Weekly subscription with full access', null, 900, '{"unlimited_sessions": true, "ai_feedback": true, "advanced_analytics": true, "voice_responses": true}', 999, 20),
('Monthly Premium', 'Monthly subscription with full access and savings', 2900, null, '{"unlimited_sessions": true, "ai_feedback": true, "advanced_analytics": true, "voice_responses": true, "priority_support": true}', 999, 20);

-- Insert default question categories
INSERT INTO public.question_categories (name, description) VALUES
('Behavioral', 'Questions about past experiences and behavior in workplace situations'),
('Technical', 'Role-specific technical questions and problem-solving scenarios'),
('Situational', 'Hypothetical scenarios to assess problem-solving and decision-making'),
('Leadership', 'Questions focused on leadership experience and management skills'),
('Communication', 'Questions assessing communication and interpersonal skills'),
('Problem Solving', 'Questions that test analytical thinking and creative solutions');

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- User dashboard summary view
CREATE VIEW user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    up.target_role,
    up.experience_level,
    us.status as subscription_status,
    sp.name as plan_name,
    COUNT(DISTINCT ps.id) as total_sessions,
    ROUND(AVG(ps.overall_score), 2) as avg_score,
    COUNT(DISTINCT ur.id) as total_responses,
    MAX(ps.completed_at) as last_session_date
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status IN ('trial', 'active')
LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN public.practice_sessions ps ON u.id = ps.user_id AND ps.status = 'completed'
LEFT JOIN public.user_responses ur ON u.id = ur.user_id
GROUP BY u.id, u.full_name, up.target_role, up.experience_level, us.status, sp.name;

-- Popular questions view for caching insights
CREATE VIEW popular_questions AS
SELECT 
    q.id,
    q.title,
    q.question_type,
    q.role,
    q.difficulty,
    q.usage_count,
    q.rating,
    qc.name as category_name,
    COUNT(ur.id) as response_count,
    ROUND(AVG(ur.ai_score), 2) as avg_user_score
FROM public.questions q
LEFT JOIN public.question_categories qc ON q.category_id = qc.id
LEFT JOIN public.user_responses ur ON q.id = ur.question_id
GROUP BY q.id, q.title, q.question_type, q.role, q.difficulty, q.usage_count, q.rating, qc.name
ORDER BY q.usage_count DESC, q.rating DESC;

-- =============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =============================================

-- Function to get user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
    is_subscribed BOOLEAN,
    plan_name VARCHAR(100),
    status VARCHAR(20),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    period_ends_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN us.status IN ('trial', 'active') THEN true 
            ELSE false 
        END as is_subscribed,
        sp.name as plan_name,
        us.status,
        us.trial_end_date as trial_ends_at,
        us.current_period_end as period_ends_at
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_uuid
    AND us.status IN ('trial', 'active')
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- If no active subscription found, return default values
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'None'::VARCHAR(100), 'none'::VARCHAR(20), NULL::TIMESTAMP WITH TIME ZONE, NULL::TIMESTAMP WITH TIME ZONE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update question usage count
CREATE OR REPLACE FUNCTION increment_question_usage(question_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.questions 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = question_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.users IS 'Core user authentication data extending Supabase auth.users';
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information for career goals and preferences';
COMMENT ON TABLE public.subscription_plans IS 'Available subscription tiers and features';
COMMENT ON TABLE public.user_subscriptions IS 'User subscription status and billing information';
COMMENT ON TABLE public.question_categories IS 'Categories for organizing interview questions';
COMMENT ON TABLE public.questions IS 'Cached AI-generated questions to reduce API costs';
COMMENT ON TABLE public.practice_sessions IS 'User practice sessions and overall performance';
COMMENT ON TABLE public.user_responses IS 'Individual question responses with AI feedback';
COMMENT ON TABLE public.user_progress IS 'Daily/weekly progress metrics for analytics';
COMMENT ON TABLE public.analytics_daily IS 'Platform-wide daily usage analytics';
COMMENT ON TABLE public.user_achievements IS 'User milestones and achievement tracking';

COMMENT ON COLUMN public.questions.usage_count IS 'Track how often questions are used to optimize caching';
COMMENT ON COLUMN public.questions.rating IS 'User ratings to identify high-quality questions';
COMMENT ON COLUMN public.user_responses.ai_score IS 'AI-generated score from 0-100 based on response quality';
COMMENT ON COLUMN public.user_subscriptions.stripe_customer_id IS 'Stripe customer ID for payment processing';