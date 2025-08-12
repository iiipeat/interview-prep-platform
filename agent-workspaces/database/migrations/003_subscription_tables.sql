-- Migration 003: Subscription Management
-- Created: 2025-08-08
-- Description: Create subscription plans and user subscription tracking

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

-- Indexes for subscription tables
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON public.subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON public.user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription plans are publicly readable" ON public.subscription_plans 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions 
    FOR ALL USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_weekly, features, max_sessions_per_day, max_questions_per_session) VALUES
('Free Trial', '7-day free trial with limited access', null, null, '{"trial_period": 7, "ai_feedback": true, "basic_analytics": true}', 2, 5),
('Weekly Premium', 'Weekly subscription with full access', null, 900, '{"unlimited_sessions": true, "ai_feedback": true, "advanced_analytics": true, "voice_responses": true}', 999, 20),
('Monthly Premium', 'Monthly subscription with full access and savings', 2900, null, '{"unlimited_sessions": true, "ai_feedback": true, "advanced_analytics": true, "voice_responses": true, "priority_support": true}', 999, 20);