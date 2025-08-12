-- ============================================
-- COMPLETE SUPABASE SCHEMA FOR INTERVIEW PREP PLATFORM
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: INITIAL SETUP AND EXTENSIONS
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- STEP 2: USER MANAGEMENT TABLES
-- ============================================

-- Users table extending Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    provider VARCHAR(50) DEFAULT 'email',
    provider_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles for extended information
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    current_job_role VARCHAR(255),
    target_role VARCHAR(255),
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'executive')),
    industry VARCHAR(255),
    skills TEXT[],
    career_goals TEXT,
    user_location VARCHAR(255),
    user_timezone VARCHAR(50),
    preferred_difficulty VARCHAR(20) CHECK (preferred_difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- STEP 3: SUBSCRIPTION TABLES
-- ============================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_weekly DECIMAL(10,2),
    features JSONB,
    max_sessions_per_day INTEGER,
    max_questions_per_session INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status VARCHAR(50) CHECK (status IN ('trial', 'active', 'canceled', 'expired', 'past_due')),
    trial_start_date DATE,
    trial_end_date DATE,
    current_period_start DATE,
    current_period_end DATE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: QUESTION TABLES
-- ============================================

-- Question categories
CREATE TABLE IF NOT EXISTS public.question_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions bank
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.question_categories(id),
    question_type VARCHAR(50) CHECK (question_type IN ('behavioral', 'technical', 'situational', 'case_study')),
    role VARCHAR(255),
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'executive')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    title VARCHAR(500) NOT NULL,
    question_text TEXT NOT NULL,
    context TEXT,
    sample_answer TEXT,
    evaluation_criteria JSONB,
    tags TEXT[],
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: SESSION TABLES
-- ============================================

-- Practice sessions
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) CHECK (session_type IN ('quick', 'full', 'custom', 'mock_interview')),
    target_role VARCHAR(255),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    duration_minutes INTEGER,
    status VARCHAR(50) CHECK (status IN ('in_progress', 'completed', 'abandoned')),
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
CREATE TABLE IF NOT EXISTS public.user_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    response_text TEXT,
    response_audio_url TEXT,
    response_duration_seconds INTEGER,
    ai_score DECIMAL(5,2),
    ai_feedback TEXT,
    strengths TEXT[],
    improvements TEXT[],
    question_rating INTEGER CHECK (question_rating >= 1 AND question_rating <= 5),
    response_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 6: ANALYTICS TABLES
-- ============================================

-- User progress tracking
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2),
    metric_data JSONB,
    date_recorded DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255),
    description TEXT,
    icon_name VARCHAR(100),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Prompt usage tracking
CREATE TABLE IF NOT EXISTS public.prompt_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ============================================
-- STEP 7: CREATE INDEXES
-- ============================================

-- User tables indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON public.users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe ON public.user_subscriptions(stripe_customer_id, stripe_subscription_id);

-- Question indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_session_id ON public.user_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_user_id ON public.user_responses(user_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_user_date ON public.prompt_usage(user_id, date);

-- ============================================
-- STEP 8: CREATE TRIGGERS
-- ============================================

-- Update triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON public.subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON public.user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON public.questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_sessions_updated_at 
    BEFORE UPDATE ON public.practice_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_responses_updated_at 
    BEFORE UPDATE ON public.user_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 9: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_usage ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Users can manage own profile" ON public.user_profiles 
    FOR ALL USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions 
    FOR ALL USING (auth.role() = 'service_role');

-- Questions policies (everyone can read)
CREATE POLICY "Anyone can view active questions" ON public.questions 
    FOR SELECT USING (true);
CREATE POLICY "Anyone can view categories" ON public.question_categories 
    FOR SELECT USING (is_active = true);

-- Sessions policies
CREATE POLICY "Users can manage own sessions" ON public.practice_sessions 
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own responses" ON public.user_responses 
    FOR ALL USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own progress" ON public.user_progress 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON public.user_achievements 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own prompt usage" ON public.prompt_usage 
    FOR ALL USING (auth.uid() = user_id);

-- Plans are public
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans 
    FOR SELECT USING (is_active = true);

-- ============================================
-- STEP 10: INSERT DEFAULT DATA
-- ============================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_weekly, price_monthly, features, max_sessions_per_day, max_questions_per_session, is_active)
VALUES 
    ('Free Trial', 'Try our platform free for 7 days', 0, 0, 
     '{"features": ["5 questions per day", "Basic AI feedback", "Access to all industries", "Progress tracking"]}', 
     1, 5, true),
    ('Weekly Plan', 'Perfect for short-term interview prep', 5, null, 
     '{"features": ["20 questions per day", "Advanced AI feedback", "All question types", "Detailed analytics", "Export to Google Sheets"]}', 
     5, 20, true),
    ('Monthly Unlimited', 'Complete interview preparation', null, 29, 
     '{"features": ["Unlimited questions", "Premium AI feedback", "Practice Buddy matching", "Video practice sessions", "Priority support", "Resume analysis", "Custom question sets"]}', 
     null, null, true);

-- Insert default question categories
INSERT INTO public.question_categories (name, description, is_active)
VALUES 
    ('Behavioral', 'Questions about past experiences and behaviors', true),
    ('Technical', 'Role-specific technical questions', true),
    ('Situational', 'Hypothetical scenario questions', true),
    ('Cultural Fit', 'Company culture and values alignment', true),
    ('Leadership', 'Leadership and management questions', true),
    ('Problem Solving', 'Analytical and problem-solving questions', true);

-- ============================================
-- STEP 11: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
    is_subscribed BOOLEAN,
    plan_name VARCHAR,
    status VARCHAR,
    trial_ends_at DATE,
    period_ends_at DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN us.status IN ('active', 'trial') THEN true ELSE false END as is_subscribed,
        sp.name as plan_name,
        us.status,
        us.trial_end_date as trial_ends_at,
        us.current_period_end as period_ends_at
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_uuid
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment question usage count
CREATE OR REPLACE FUNCTION increment_question_usage(question_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.questions 
    SET usage_count = usage_count + 1 
    WHERE id = question_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, provider, created_at)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        COALESCE(new.raw_app_meta_data->>'provider', 'email'),
        new.created_at
    );
    
    INSERT INTO public.user_profiles (user_id, created_at)
    VALUES (new.id, new.created_at);
    
    -- Create free trial subscription
    INSERT INTO public.user_subscriptions (
        user_id, 
        plan_id, 
        status, 
        trial_start_date, 
        trial_end_date,
        created_at
    )
    SELECT 
        new.id,
        sp.id,
        'trial',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '7 days',
        NOW()
    FROM public.subscription_plans sp
    WHERE sp.name = 'Free Trial'
    LIMIT 1;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STEP 12: CREATE VIEWS
-- ============================================

-- User dashboard summary view
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    up.target_role,
    up.experience_level,
    us.status as subscription_status,
    sp.name as plan_name,
    COUNT(DISTINCT ps.id) as total_sessions,
    AVG(ps.overall_score) as avg_score,
    COUNT(DISTINCT ur.id) as total_responses,
    MAX(ps.created_at) as last_session_date
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id
LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN public.practice_sessions ps ON u.id = ps.user_id
LEFT JOIN public.user_responses ur ON u.id = ur.user_id
GROUP BY u.id, u.full_name, up.target_role, up.experience_level, us.status, sp.name;

-- Popular questions view
CREATE OR REPLACE VIEW popular_questions AS
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
    AVG(ur.ai_score) as avg_user_score
FROM public.questions q
LEFT JOIN public.question_categories qc ON q.category_id = qc.id
LEFT JOIN public.user_responses ur ON q.id = ur.question_id
GROUP BY q.id, q.title, q.question_type, q.role, q.difficulty, q.usage_count, q.rating, qc.name
ORDER BY q.usage_count DESC, q.rating DESC;

-- ============================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================

-- Check if all tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check subscription plans
SELECT * FROM public.subscription_plans;

-- Check question categories
SELECT * FROM public.question_categories;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see this message, the schema was created successfully!
-- Next steps:
-- 1. Configure authentication providers in Supabase Dashboard
-- 2. Update environment variables in your application
-- 3. Test the connection from your application