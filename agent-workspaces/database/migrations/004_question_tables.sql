-- Migration 004: Question Management and Caching
-- Created: 2025-08-08
-- Description: Create question categories and cached questions system

-- Question categories
CREATE TABLE public.question_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cached AI-generated questions
CREATE TABLE public.questions (
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
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for question tables
CREATE INDEX idx_questions_category ON public.questions(category_id);
CREATE INDEX idx_questions_type_role ON public.questions(question_type, role);
CREATE INDEX idx_questions_difficulty_level ON public.questions(difficulty, experience_level);
CREATE INDEX idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX idx_questions_usage_count ON public.questions(usage_count DESC);
CREATE INDEX idx_questions_rating ON public.questions(rating DESC);

-- Triggers for updated_at
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON public.questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are publicly readable" ON public.questions 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Question categories are publicly readable" ON public.question_categories 
    FOR SELECT TO authenticated USING (true);

-- Insert default question categories
INSERT INTO public.question_categories (name, description) VALUES
('Behavioral', 'Questions about past experiences and behavior in workplace situations'),
('Technical', 'Role-specific technical questions and problem-solving scenarios'),
('Situational', 'Hypothetical scenarios to assess problem-solving and decision-making'),
('Leadership', 'Questions focused on leadership experience and management skills'),
('Communication', 'Questions assessing communication and interpersonal skills'),
('Problem Solving', 'Questions that test analytical thinking and creative solutions');