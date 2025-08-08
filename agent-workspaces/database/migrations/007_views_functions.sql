-- Migration 007: Views and Utility Functions
-- Created: 2025-08-08
-- Description: Create helpful views and utility functions

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