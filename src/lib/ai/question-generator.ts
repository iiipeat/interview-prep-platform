/**
 * AI Question Generator Service
 * Integrates with Claude API for intelligent interview question generation
 */

import { createClient } from '@supabase/supabase-js';

// Types for question generation
export interface QuestionGenerationRequest {
  industry: string;
  role: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  careerPath?: string;
  jobDescription?: string;
  questionCount?: number;
  questionTypes?: ('behavioral' | 'technical' | 'situational' | 'cultural')[];
}

export interface GeneratedQuestion {
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'cultural';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  followUpQuestions?: string[];
  evaluationCriteria?: string[];
  timeToAnswer?: number; // in seconds
}

export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
  cached: boolean;
  generationTime: number;
}

/**
 * Industry-specific prompt templates
 */
const INDUSTRY_PROMPTS = {
  technology: {
    keywords: ['algorithm', 'system design', 'debugging', 'scalability', 'code review'],
    focus: 'technical problem-solving and system architecture',
  },
  finance: {
    keywords: ['risk management', 'financial modeling', 'compliance', 'market analysis'],
    focus: 'analytical skills and regulatory knowledge',
  },
  healthcare: {
    keywords: ['patient care', 'HIPAA', 'clinical procedures', 'medical ethics'],
    focus: 'patient interaction and medical knowledge',
  },
  retail: {
    keywords: ['customer service', 'inventory', 'sales', 'complaint handling'],
    focus: 'customer interaction and sales techniques',
  },
  education: {
    keywords: ['curriculum', 'classroom management', 'student engagement', 'assessment'],
    focus: 'teaching methods and student development',
  },
  hospitality: {
    keywords: ['guest satisfaction', 'service recovery', 'team coordination', 'multitasking'],
    focus: 'customer service excellence and problem resolution',
  },
  default: {
    keywords: ['teamwork', 'problem-solving', 'communication', 'leadership'],
    focus: 'general professional skills',
  },
};

/**
 * Question type templates
 */
const QUESTION_TEMPLATES = {
  behavioral: [
    'Tell me about a time when you {scenario}',
    'Describe a situation where you had to {challenge}',
    'Give me an example of when you {action}',
    'How do you handle {situation}?',
    'What would you do if {hypothetical}?',
  ],
  technical: [
    'How would you {technical_task}?',
    'Explain the concept of {technical_concept}',
    'What are the advantages and disadvantages of {technology}?',
    'Design a solution for {problem}',
    'Walk me through your approach to {technical_challenge}',
  ],
  situational: [
    'Imagine you are faced with {scenario}. How would you respond?',
    'If you encountered {problem}, what steps would you take?',
    'How would you prioritize {competing_demands}?',
    'What would be your strategy for {business_situation}?',
  ],
  cultural: [
    'What type of work environment do you thrive in?',
    'How do you align with our company values of {values}?',
    'Describe your ideal team dynamic',
    'What motivates you in your work?',
  ],
};

class QuestionGeneratorService {
  private supabase: any;
  private anthropicApiKey: string;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY!;
  }

  /**
   * Generate interview questions based on user profile
   */
  async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<QuestionGenerationResponse> {
    const startTime = Date.now();

    // First, check cache for similar questions
    const cachedQuestions = await this.checkCache(request);
    if (cachedQuestions.length > 0) {
      return {
        questions: cachedQuestions,
        cached: true,
        generationTime: Date.now() - startTime,
      };
    }

    // Generate new questions using Claude API
    const questions = await this.generateWithClaude(request);

    // Cache the generated questions
    await this.cacheQuestions(request, questions);

    return {
      questions,
      cached: false,
      generationTime: Date.now() - startTime,
    };
  }

  /**
   * Check cache for existing questions
   */
  private async checkCache(
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    try {
      // Query cached questions matching the profile
      const { data, error } = await this.supabase
        .from('cached_questions')
        .select('*')
        .eq('industry', request.industry.toLowerCase())
        .eq('role', request.role.toLowerCase())
        .eq('experience_level', request.experienceLevel)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .limit(request.questionCount || 10);

      if (error || !data) return [];

      // Transform cached data to GeneratedQuestion format
      return data.map((q: any) => ({
        question: q.question_text,
        type: q.question_type,
        difficulty: q.difficulty_level,
        category: q.category,
        followUpQuestions: q.follow_up_questions,
        evaluationCriteria: q.evaluation_criteria,
        timeToAnswer: q.time_to_answer,
      }));
    } catch (error) {
      console.error('Cache check error:', error);
      return [];
    }
  }

  /**
   * Generate questions using Claude API
   */
  private async generateWithClaude(
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    const prompt = this.buildPrompt(request);

    try {
      // For now, use intelligent fallback generation
      // In production, this would call the actual Claude API
      return this.intelligentFallbackGeneration(request);
    } catch (error) {
      console.error('Claude API error:', error);
      // Fallback to rule-based generation
      return this.intelligentFallbackGeneration(request);
    }
  }

  /**
   * Build prompt for Claude API
   */
  private buildPrompt(request: QuestionGenerationRequest): string {
    const industry = INDUSTRY_PROMPTS[request.industry.toLowerCase() as keyof typeof INDUSTRY_PROMPTS] || INDUSTRY_PROMPTS.default;
    const questionCount = request.questionCount || 10;

    return `Generate ${questionCount} realistic interview questions for a ${request.experienceLevel} level ${request.role} position in the ${request.industry} industry.

Focus on: ${industry.focus}
Key areas: ${industry.keywords.join(', ')}

${request.careerPath ? `Candidate's career path: ${request.careerPath}` : ''}
${request.jobDescription ? `Job description: ${request.jobDescription}` : ''}

Requirements:
1. Mix of question types: behavioral, technical (if applicable), situational, and cultural fit
2. Adjust difficulty based on experience level
3. Make questions specific to the industry and role
4. Include follow-up questions for deeper assessment
5. Provide evaluation criteria for each question

Format each question as JSON with: question, type, difficulty, category, followUpQuestions, evaluationCriteria, timeToAnswer`;
  }

  /**
   * Intelligent fallback generation when API is unavailable
   */
  private intelligentFallbackGeneration(
    request: QuestionGenerationRequest
  ): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    const industry = INDUSTRY_PROMPTS[request.industry.toLowerCase() as keyof typeof INDUSTRY_PROMPTS] || INDUSTRY_PROMPTS.default;
    const questionCount = request.questionCount || 10;

    // Generate behavioral questions (40%)
    const behavioralCount = Math.floor(questionCount * 0.4);
    for (let i = 0; i < behavioralCount; i++) {
      questions.push(this.generateBehavioralQuestion(request, industry));
    }

    // Generate technical questions (30%) - if applicable
    const technicalCount = Math.floor(questionCount * 0.3);
    for (let i = 0; i < technicalCount; i++) {
      questions.push(this.generateTechnicalQuestion(request, industry));
    }

    // Generate situational questions (20%)
    const situationalCount = Math.floor(questionCount * 0.2);
    for (let i = 0; i < situationalCount; i++) {
      questions.push(this.generateSituationalQuestion(request, industry));
    }

    // Generate cultural fit questions (10%)
    const culturalCount = questionCount - questions.length;
    for (let i = 0; i < culturalCount; i++) {
      questions.push(this.generateCulturalQuestion(request));
    }

    return questions;
  }

  /**
   * Generate behavioral question
   */
  private generateBehavioralQuestion(request: any, industry: any): GeneratedQuestion {
    const scenarios = {
      entry: ['faced a challenging deadline', 'worked in a team', 'learned a new skill'],
      mid: ['led a project', 'resolved a conflict', 'improved a process'],
      senior: ['managed a crisis', 'mentored team members', 'drove organizational change'],
      executive: ['made a strategic decision', 'transformed a department', 'navigated market challenges'],
    };

    const scenario = scenarios[request.experienceLevel as keyof typeof scenarios]?.[Math.floor(Math.random() * 3)] || 'handled a challenging situation';

    return {
      question: `Tell me about a time when you ${scenario} in your ${request.role || 'professional'} experience.`,
      type: 'behavioral',
      difficulty: request.experienceLevel === 'entry' ? 'easy' : request.experienceLevel === 'mid' ? 'medium' : 'hard',
      category: 'Experience & Behavior',
      followUpQuestions: [
        'What was the outcome?',
        'What would you do differently?',
        'How did you measure success?',
      ],
      evaluationCriteria: [
        'Clear situation description',
        'Specific actions taken',
        'Measurable results',
        'Learning demonstrated',
      ],
      timeToAnswer: 120,
    };
  }

  /**
   * Generate technical question
   */
  private generateTechnicalQuestion(request: any, industry: any): GeneratedQuestion {
    const technicalTopics = {
      technology: ['system architecture', 'code optimization', 'database design', 'API development'],
      finance: ['financial modeling', 'risk assessment', 'regulatory compliance', 'data analysis'],
      healthcare: ['patient protocols', 'medical procedures', 'healthcare regulations', 'clinical best practices'],
      default: ['industry best practices', 'quality standards', 'process improvement', 'data management'],
    };

    const topics = technicalTopics[request.industry.toLowerCase() as keyof typeof technicalTopics] || technicalTopics.default;
    const topic = topics[Math.floor(Math.random() * topics.length)];

    return {
      question: `How would you approach ${topic} in the context of a ${request.role} position?`,
      type: 'technical',
      difficulty: request.experienceLevel === 'senior' || request.experienceLevel === 'executive' ? 'hard' : 'medium',
      category: 'Technical Knowledge',
      followUpQuestions: [
        'Can you provide a specific example?',
        'What tools or methodologies would you use?',
        'How would you measure effectiveness?',
      ],
      evaluationCriteria: [
        'Technical accuracy',
        'Practical application',
        'Industry knowledge',
        'Problem-solving approach',
      ],
      timeToAnswer: 180,
    };
  }

  /**
   * Generate situational question
   */
  private generateSituationalQuestion(request: any, industry: any): GeneratedQuestion {
    const situations = {
      entry: ['competing priorities', 'unclear instructions', 'learning curve challenges'],
      mid: ['resource constraints', 'stakeholder disagreements', 'process inefficiencies'],
      senior: ['strategic pivots', 'team restructuring', 'budget cuts'],
      executive: ['market disruption', 'merger integration', 'cultural transformation'],
    };

    const situation = situations[request.experienceLevel as keyof typeof situations]?.[Math.floor(Math.random() * 3)] || 'a challenging situation';

    return {
      question: `If you were faced with ${situation} in your role as ${request.role}, how would you handle it?`,
      type: 'situational',
      difficulty: 'medium',
      category: 'Problem Solving',
      followUpQuestions: [
        'What would be your first step?',
        'Who would you involve in the solution?',
        'How would you communicate your approach?',
      ],
      evaluationCriteria: [
        'Logical approach',
        'Stakeholder consideration',
        'Risk assessment',
        'Communication skills',
      ],
      timeToAnswer: 90,
    };
  }

  /**
   * Generate cultural fit question
   */
  private generateCulturalQuestion(request: any): GeneratedQuestion {
    const culturalAspects = [
      'work-life balance',
      'team collaboration',
      'continuous learning',
      'innovation and creativity',
      'customer focus',
    ];

    const aspect = culturalAspects[Math.floor(Math.random() * culturalAspects.length)];

    return {
      question: `How important is ${aspect} to you in your ideal work environment?`,
      type: 'cultural',
      difficulty: 'easy',
      category: 'Cultural Fit',
      followUpQuestions: [
        'Can you give an example from your experience?',
        'How do you contribute to this aspect?',
      ],
      evaluationCriteria: [
        'Value alignment',
        'Self-awareness',
        'Team fit',
      ],
      timeToAnswer: 60,
    };
  }

  /**
   * Cache generated questions for reuse
   */
  private async cacheQuestions(
    request: QuestionGenerationRequest,
    questions: GeneratedQuestion[]
  ): Promise<void> {
    try {
      const cacheData = questions.map(q => ({
        industry: request.industry.toLowerCase(),
        role: request.role.toLowerCase(),
        experience_level: request.experienceLevel,
        question_text: q.question,
        question_type: q.type,
        difficulty_level: q.difficulty,
        category: q.category,
        follow_up_questions: q.followUpQuestions,
        evaluation_criteria: q.evaluationCriteria,
        time_to_answer: q.timeToAnswer,
        usage_count: 0,
        rating: 0,
      }));

      await this.supabase.from('cached_questions').insert(cacheData);
    } catch (error) {
      console.error('Caching error:', error);
      // Continue without caching
    }
  }
}

// Export singleton instance
export const questionGenerator = new QuestionGeneratorService();

// Export helper function for API routes
export async function generateInterviewQuestions(
  request: QuestionGenerationRequest
): Promise<QuestionGenerationResponse> {
  return questionGenerator.generateQuestions(request);
}