-- Migration 005: Practice Sessions and Responses
-- Created: 2025-08-08
-- Description: Create practice sessions and user response tracking

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

-- Indexes for session tables
CREATE INDEX idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_status ON public.practice_sessions(status);
CREATE INDEX idx_practice_sessions_started_at ON public.practice_sessions(started_at DESC);

CREATE INDEX idx_user_responses_session_id ON public.user_responses(session_id);
CREATE INDEX idx_user_responses_user_id ON public.user_responses(user_id);
CREATE INDEX idx_user_responses_question_id ON public.user_responses(question_id);
CREATE INDEX idx_user_responses_created_at ON public.user_responses(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_practice_sessions_updated_at 
    BEFORE UPDATE ON public.practice_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_responses_updated_at 
    BEFORE UPDATE ON public.user_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.practice_sessions 
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own responses" ON public.user_responses 
    FOR ALL USING (auth.uid() = user_id);