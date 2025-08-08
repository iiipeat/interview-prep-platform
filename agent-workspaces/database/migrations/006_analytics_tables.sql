-- Migration 006: Analytics and Progress Tracking
-- Created: 2025-08-08
-- Description: Create analytics, progress tracking, and achievements

-- User progress tracking
CREATE TABLE public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2),
    metric_data JSONB,
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
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255),
    description TEXT,
    icon_name VARCHAR(100),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_type)
);

-- Indexes for analytics tables
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_date ON public.user_progress(date_recorded DESC);
CREATE INDEX idx_user_progress_metric ON public.user_progress(metric_name, date_recorded DESC);
CREATE INDEX idx_analytics_daily_date ON public.analytics_daily(date DESC);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON public.user_achievements(achievement_type);

-- Row Level Security
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_progress 
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON public.user_achievements 
    FOR ALL USING (auth.uid() = user_id);

-- Note: analytics_daily table is for admin use only, no RLS needed