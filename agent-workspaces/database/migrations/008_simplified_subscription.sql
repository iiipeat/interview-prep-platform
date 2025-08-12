-- Migration 008: Simplified Subscription Model
-- Created: 2025-08-10
-- Description: Simplify subscription to single plan with prompt usage tracking

-- First, let's add prompt usage tracking table
CREATE TABLE public.prompt_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE,
    prompt_count INTEGER DEFAULT 0,
    prompt_limit INTEGER DEFAULT 20,
    reset_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, usage_date)
);

-- Create indexes for prompt usage
CREATE INDEX idx_prompt_usage_user_date ON public.prompt_usage(user_id, usage_date DESC);
CREATE INDEX idx_prompt_usage_date ON public.prompt_usage(usage_date DESC);

-- Add RLS for prompt usage
ALTER TABLE public.prompt_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prompt usage" ON public.prompt_usage 
    FOR ALL USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_prompt_usage_updated_at 
    BEFORE UPDATE ON public.prompt_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clear existing subscription plans (this will cascade to user_subscriptions due to FK)
DELETE FROM public.subscription_plans;

-- Insert the new simplified subscription plan
INSERT INTO public.subscription_plans (
    id,
    name, 
    description, 
    price_monthly, 
    price_weekly, 
    features, 
    max_sessions_per_day, 
    max_questions_per_session,
    is_active
) VALUES (
    uuid_generate_v4(),
    'Interview Prep Access',
    '7-day free trial, then $5/week for unlimited interview practice with AI feedback',
    null,  -- No monthly pricing
    500,   -- $5/week in cents
    '{
        "trial_period": 7,
        "daily_prompt_limit": 20,
        "ai_feedback": true,
        "all_industries": true,
        "progress_tracking": true,
        "achievements": true,
        "unlimited_sessions": true,
        "advanced_analytics": true,
        "voice_responses": true
    }',
    999,   -- Unlimited sessions per day
    20,    -- Max questions per session
    true
);

-- Add a helper function to check daily prompt usage
CREATE OR REPLACE FUNCTION public.get_daily_prompt_usage(user_uuid UUID, check_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    current_usage INTEGER,
    daily_limit INTEGER,
    remaining_prompts INTEGER,
    can_make_prompt BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_record RECORD;
    default_limit INTEGER := 20;
BEGIN
    -- Get or create usage record for the date
    SELECT prompt_count, prompt_limit INTO usage_record
    FROM public.prompt_usage 
    WHERE user_id = user_uuid AND usage_date = check_date;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.prompt_usage (user_id, usage_date, prompt_count, prompt_limit)
        VALUES (user_uuid, check_date, 0, default_limit)
        ON CONFLICT (user_id, usage_date) DO NOTHING;
        
        usage_record.prompt_count := 0;
        usage_record.prompt_limit := default_limit;
    END IF;
    
    -- Return the usage information
    RETURN QUERY SELECT 
        usage_record.prompt_count,
        usage_record.prompt_limit,
        GREATEST(0, usage_record.prompt_limit - usage_record.prompt_count),
        (usage_record.prompt_count < usage_record.prompt_limit);
END;
$$;

-- Add a function to increment prompt usage
CREATE OR REPLACE FUNCTION public.increment_prompt_usage(user_uuid UUID, usage_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER;
    daily_limit INTEGER;
BEGIN
    -- Get current usage
    SELECT prompt_count, prompt_limit INTO current_count, daily_limit
    FROM public.prompt_usage 
    WHERE user_id = user_uuid AND usage_date = usage_date;
    
    -- If no record exists, create one with count of 1
    IF NOT FOUND THEN
        INSERT INTO public.prompt_usage (user_id, usage_date, prompt_count, prompt_limit)
        VALUES (user_uuid, usage_date, 1, 20)
        ON CONFLICT (user_id, usage_date) DO UPDATE SET 
            prompt_count = prompt_usage.prompt_count + 1,
            updated_at = NOW();
        RETURN TRUE;
    END IF;
    
    -- Check if user has reached limit
    IF current_count >= daily_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Increment usage
    UPDATE public.prompt_usage 
    SET prompt_count = prompt_count + 1,
        updated_at = NOW()
    WHERE user_id = user_uuid AND usage_date = usage_date;
    
    RETURN TRUE;
END;
$$;

-- Create a view for subscription status with prompt usage
CREATE OR REPLACE VIEW public.user_subscription_status AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    us.id as subscription_id,
    sp.name as plan_name,
    sp.price_weekly,
    us.status as subscription_status,
    us.trial_start_date,
    us.trial_end_date,
    us.current_period_start,
    us.current_period_end,
    us.cancel_at_period_end,
    us.stripe_customer_id,
    us.stripe_subscription_id,
    -- Check if user is in trial period
    CASE 
        WHEN us.trial_end_date IS NOT NULL AND us.trial_end_date > NOW() THEN true
        ELSE false
    END as is_in_trial,
    -- Check if subscription is active (trial or paid)
    CASE 
        WHEN us.status = 'trial' AND us.trial_end_date > NOW() THEN true
        WHEN us.status = 'active' AND us.current_period_end > NOW() THEN true
        ELSE false
    END as has_active_access,
    -- Daily prompt usage for today
    COALESCE(pu.prompt_count, 0) as today_prompt_count,
    COALESCE(pu.prompt_limit, 20) as daily_prompt_limit,
    GREATEST(0, COALESCE(pu.prompt_limit, 20) - COALESCE(pu.prompt_count, 0)) as remaining_prompts_today
FROM public.users u
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id
LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN public.prompt_usage pu ON u.id = pu.user_id AND pu.usage_date = CURRENT_DATE
WHERE sp.is_active = true OR sp.is_active IS NULL;

-- Grant permissions for the view
GRANT SELECT ON public.user_subscription_status TO authenticated;

-- Create RLS policy for the view (users can only see their own status)
CREATE POLICY "Users can view own subscription status" ON public.user_subscription_status 
    FOR SELECT USING (auth.uid() = user_id);

-- Add comment explaining the migration
COMMENT ON TABLE public.prompt_usage IS 'Tracks daily prompt usage for subscription management';
COMMENT ON FUNCTION public.get_daily_prompt_usage IS 'Returns current prompt usage stats for a user on a given date';
COMMENT ON FUNCTION public.increment_prompt_usage IS 'Increments prompt usage count, returns false if limit exceeded';
COMMENT ON VIEW public.user_subscription_status IS 'Comprehensive view of user subscription and usage status';