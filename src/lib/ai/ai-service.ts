// Dynamic import to avoid build errors when package is not installed
let GoogleGenerativeAI: any = null;
let genAI: any = null;

// Try to load Google AI SDK if available
if (typeof window === 'undefined') {
  try {
    const { GoogleGenerativeAI: GAPI } = require('@google/generative-ai');
    if (process.env.GOOGLE_AI_API_KEY) {
      genAI = new GAPI(process.env.GOOGLE_AI_API_KEY);
    }
  } catch (error) {
    console.log('Google AI SDK not installed, using mock data');
  }
}

export interface QuestionGenerationParams {
  industry: string;
  role: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  difficulty: 'easy' | 'medium' | 'hard';
  questionType?: 'behavioral' | 'technical' | 'situational' | 'cultural';
  count?: number;
  previousQuestions?: string[];
}

export interface AnswerAnalysisParams {
  question: string;
  answer: string;
  questionType: string;
  industry: string;
  role: string;
}

export interface GeneratedQuestion {
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'cultural';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tips: string[];
  evaluationCriteria: string[];
  followUpQuestions?: string[];
  timeToAnswer: number;
}

export interface AnswerFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  tips: string[];
  overallAssessment: string;
  suggestedFollowUp?: string;
}

class AIService {
  private googleAI: any;

  constructor() {
    this.googleAI = genAI;
  }

  /**
   * Generate interview questions using Claude API
   */
  async generateQuestions(params: QuestionGenerationParams): Promise<GeneratedQuestion[]> {
    if (!this.googleAI) {
      // Fallback to mock questions if API not configured
      return this.generateMockQuestions(params);
    }

    try {
      const prompt = this.buildQuestionPrompt(params);
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      return this.parseQuestionResponse(content);
    } catch (error) {
      console.error('Error generating questions with Google AI:', error);
      return this.generateMockQuestions(params);
    }
  }

  /**
   * Analyze user's answer and provide feedback
   */
  async analyzeAnswer(params: AnswerAnalysisParams): Promise<AnswerFeedback> {
    if (!this.googleAI) {
      // Fallback to mock feedback if API not configured
      return this.generateMockFeedback(params);
    }

    try {
      const prompt = this.buildFeedbackPrompt(params);
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      return this.parseFeedbackResponse(content);
    } catch (error) {
      console.error('Error analyzing answer with Google AI:', error);
      return this.generateMockFeedback(params);
    }
  }

  /**
   * Generate a practice buddy response
   */
  async generateBuddyResponse(context: string, userMessage: string): Promise<string> {
    if (!this.googleAI) {
      return "Great point! Let me think about that...";
    }

    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `You are a practice interview partner. Context: ${context}\n\nUser said: ${userMessage}\n\nProvide a helpful, encouraging response as their practice partner:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating buddy response:', error);
      return "That's interesting! Can you elaborate more on that?";
    }
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionPrompt(params: QuestionGenerationParams): string {
    const difficultyGuidelines = this.getDifficultyGuidelines(params.difficulty);
    const roleSpecificGuidance = this.getRoleSpecificGuidance(params.role, params.industry);
    const questionTypeGuidance = this.getQuestionTypeGuidance(params.questionType);
    
    return `You are an expert interview coach. Generate ${params.count || 1} highly specific and realistic interview question(s) for a ${params.experienceLevel} level ${params.role} position in the ${params.industry} industry.

DIFFICULTY REQUIREMENTS (${params.difficulty.toUpperCase()}):
${difficultyGuidelines}

ROLE & INDUSTRY CONTEXT:
${roleSpecificGuidance}

QUESTION TYPE FOCUS:
${questionTypeGuidance}

${params.previousQuestions ? `AVOID THESE QUESTIONS: ${params.previousQuestions.join(', ')}` : ''}

CRITICAL REQUIREMENTS:
- Questions must be realistic and commonly asked in ${params.industry} interviews
- Tailor complexity to ${params.experienceLevel} level expectations
- Include industry-specific terminology and scenarios
- Questions should differentiate candidates at the ${params.difficulty} level

For each question, respond with valid JSON in this exact format:
{
  "question": "The specific interview question",
  "type": "${params.questionType || 'behavioral'}",
  "difficulty": "${params.difficulty}",
  "category": "Specific skill/area being tested",
  "tips": ["Specific tip 1", "Specific tip 2", "Specific tip 3"],
  "evaluationCriteria": ["What interviewers look for", "Key success factors"],
  "followUpQuestions": ["Natural follow-up question 1", "Probing follow-up 2"],
  "timeToAnswer": ${this.getTimeToAnswer(params.difficulty)}
}

Generate ${params.count || 1} question(s) now:`;
  }

  /**
   * Build prompt for answer analysis
   */
  private buildFeedbackPrompt(params: AnswerAnalysisParams): string {
    return `Analyze this interview answer and provide constructive feedback.

Question: ${params.question}
Question Type: ${params.questionType}
Industry: ${params.industry}
Role: ${params.role}

User's Answer: ${params.answer}

Provide feedback in JSON format:
{
  "score": (0-100),
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Area 1", "Area 2"],
  "tips": ["Tip 1", "Tip 2"],
  "overallAssessment": "Brief overall assessment",
  "suggestedFollowUp": "A follow-up question if needed"
}

Consider:
- Relevance to the question
- Use of specific examples
- Communication clarity
- Industry-specific knowledge
- Structure (e.g., STAR method for behavioral questions)

Provide the feedback now:`;
  }

  /**
   * Parse question generation response
   */
  private parseQuestionResponse(response: string): GeneratedQuestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (error) {
      console.error('Error parsing question response:', error);
    }
    
    // Fallback to basic parsing
    return [{
      question: response.split('\n')[0] || 'Tell me about yourself.',
      type: 'behavioral',
      difficulty: 'medium',
      category: 'General',
      tips: ['Be concise', 'Focus on relevant experience', 'Show enthusiasm'],
      evaluationCriteria: ['Clarity', 'Relevance', 'Structure'],
      timeToAnswer: 120,
    }];
  }

  /**
   * Parse feedback response
   */
  private parseFeedbackResponse(response: string): AnswerFeedback {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing feedback response:', error);
    }
    
    // Fallback feedback
    return {
      score: 75,
      strengths: ['Clear communication', 'Good structure'],
      improvements: ['Add more specific examples', 'Quantify achievements'],
      tips: ['Use the STAR method', 'Practice your delivery'],
      overallAssessment: 'Good effort with room for improvement',
    };
  }

  /**
   * Generate mock questions (fallback)
   */
  private generateMockQuestions(params: QuestionGenerationParams): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    const count = params.count || 1;
    
    for (let i = 0; i < count; i++) {
      const questionTypes = ['behavioral', 'technical', 'situational', 'cultural'] as const;
      const type = params.questionType || questionTypes[i % 4];
      const question = this.generateMockQuestionByType(type, params);
      
      questions.push({
        question: question.text,
        type,
        difficulty: params.difficulty,
        category: question.category,
        tips: this.getMockTipsByDifficulty(params.difficulty, type),
        evaluationCriteria: this.getMockEvaluationCriteria(type, params.role),
        followUpQuestions: this.getMockFollowUpQuestions(type),
        timeToAnswer: this.getTimeToAnswer(params.difficulty),
      });
    }
    
    return questions;
  }

  /**
   * Generate specific mock question by type
   */
  private generateMockQuestionByType(type: string, params: QuestionGenerationParams): { text: string, category: string } {
    const { role, industry, difficulty, experienceLevel } = params;
    
    const difficultyPrefix = difficulty === 'hard' ? 'complex ' : difficulty === 'easy' ? 'basic ' : '';
    
    switch (type) {
      case 'behavioral':
        const behavioralQuestions = [
          { text: `Tell me about a time when you had to lead a ${difficultyPrefix}project in ${industry}.`, category: 'Leadership' },
          { text: `Describe a challenging situation you faced as a ${role} and how you resolved it.`, category: 'Problem Solving' },
          { text: `Give an example of when you had to adapt to significant changes in your ${industry} role.`, category: 'Adaptability' },
          { text: `Tell me about a time you had to collaborate with difficult team members on a ${role} project.`, category: 'Teamwork' }
        ];
        return behavioralQuestions[Math.floor(Math.random() * behavioralQuestions.length)];
        
      case 'technical':
        const techQuestions = [
          { text: `What ${difficultyPrefix}technologies and tools are essential for a ${role} in ${industry}?`, category: 'Technical Knowledge' },
          { text: `How would you approach solving a ${difficultyPrefix}technical challenge specific to ${industry}?`, category: 'Technical Problem Solving' },
          { text: `Explain your experience with industry-standard practices in ${industry} for ${role} positions.`, category: 'Industry Expertise' },
          { text: `Describe the most ${difficultyPrefix}technical project you've worked on as a ${role}.`, category: 'Technical Experience' }
        ];
        return techQuestions[Math.floor(Math.random() * techQuestions.length)];
        
      case 'situational':
        const situationalQuestions = [
          { text: `What would you do if you were assigned a ${difficultyPrefix}project in ${industry} with an unrealistic deadline?`, category: 'Time Management' },
          { text: `How would you handle a situation where a key client in ${industry} was dissatisfied with your ${role} work?`, category: 'Client Relations' },
          { text: `If you discovered a significant error in a ${role} deliverable just before the deadline, how would you handle it?`, category: 'Crisis Management' },
          { text: `How would you prioritize multiple ${difficultyPrefix}tasks as a ${experienceLevel} level ${role}?`, category: 'Prioritization' }
        ];
        return situationalQuestions[Math.floor(Math.random() * situationalQuestions.length)];
        
      case 'cultural':
        const culturalQuestions = [
          { text: `What type of ${industry} work environment allows you to perform best as a ${role}?`, category: 'Work Environment' },
          { text: `How do you stay motivated during challenging periods in ${industry}?`, category: 'Motivation' },
          { text: `What are your long-term career goals as a ${role} in the ${industry} industry?`, category: 'Career Goals' },
          { text: `How do you approach continuous learning and development in your ${role} career?`, category: 'Growth Mindset' }
        ];
        return culturalQuestions[Math.floor(Math.random() * culturalQuestions.length)];
        
      default:
        return { text: `Tell me about your experience as a ${role} in ${industry}.`, category: 'General Experience' };
    }
  }

  /**
   * Get mock tips based on difficulty and type
   */
  private getMockTipsByDifficulty(difficulty: string, type: string): string[] {
    const baseTips = {
      'easy': [
        'Keep your answer simple and direct',
        'Use one clear example from your experience',
        'Focus on the basics and what you learned'
      ],
      'medium': [
        'Structure your answer using the STAR method',
        'Provide specific examples and metrics where possible',
        'Show your problem-solving process clearly'
      ],
      'hard': [
        'Demonstrate strategic thinking and complex analysis',
        'Include multiple perspectives and considerations',
        'Show leadership and decision-making under pressure'
      ]
    };

    return baseTips[difficulty as keyof typeof baseTips] || baseTips.medium;
  }

  /**
   * Get mock evaluation criteria
   */
  private getMockEvaluationCriteria(type: string, role: string): string[] {
    const criteriaMap = {
      'behavioral': ['Past behavior patterns', 'Soft skills demonstration', 'Problem-solving approach'],
      'technical': [`${role}-specific technical knowledge`, 'Industry best practices', 'Practical application'],
      'situational': ['Decision-making process', 'Analytical thinking', 'Practical solutions'],
      'cultural': ['Team fit', 'Company values alignment', 'Communication style']
    };

    return criteriaMap[type as keyof typeof criteriaMap] || ['Communication skills', 'Relevant experience'];
  }

  /**
   * Get mock follow-up questions
   */
  private getMockFollowUpQuestions(type: string): string[] {
    const followUpMap = {
      'behavioral': ['What specific steps did you take?', 'What would you do differently next time?'],
      'technical': ['Can you explain the technical details?', 'How would you scale this solution?'],
      'situational': ['What factors would influence your decision?', 'How would you measure success?'],
      'cultural': ['Can you give me a specific example?', 'How does this align with your values?']
    };

    return followUpMap[type as keyof typeof followUpMap] || ['Can you elaborate on that?', 'What was the outcome?'];
  }

  /**
   * Generate mock feedback (fallback)
   */
  private generateMockFeedback(params: AnswerAnalysisParams): AnswerFeedback {
    const score = 60 + Math.floor(Math.random() * 35);
    
    return {
      score,
      strengths: [
        'Clear communication structure',
        'Good use of examples',
        'Showed enthusiasm for the role',
      ].slice(0, 2 + Math.floor(Math.random() * 2)),
      improvements: [
        'Could provide more specific metrics',
        'Consider using the STAR method',
        'Add more industry-specific details',
      ].slice(0, 1 + Math.floor(Math.random() * 2)),
      tips: [
        'Practice your answer to be more concise',
        'Research the company culture beforehand',
        'Prepare 3-5 strong examples from your experience',
      ].slice(0, 2 + Math.floor(Math.random() * 2)),
      overallAssessment: score >= 80 
        ? 'Excellent response! You demonstrated strong understanding and communication skills.'
        : score >= 60
        ? 'Good effort with some areas for improvement. Keep practicing!'
        : 'This is a good start. Focus on the improvement areas for a stronger response.',
      suggestedFollowUp: 'Can you provide a specific example of how you applied this in your previous role?',
    };
  }
  /**
   * Get difficulty-specific guidelines
   */
  private getDifficultyGuidelines(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return `- Ask fundamental, entry-level questions
- Focus on basic concepts and straightforward scenarios
- Questions should be answerable with general knowledge and basic experience
- Avoid complex technical details or advanced problem-solving
- Time pressure should be minimal`;
      case 'medium':
        return `- Ask questions requiring some experience and deeper thinking
- Include scenario-based questions with moderate complexity
- Expect candidates to demonstrate problem-solving skills
- Include some technical depth appropriate to the role
- Questions should differentiate between junior and mid-level candidates`;
      case 'hard':
        return `- Ask advanced, complex questions requiring significant experience
- Include multi-layered scenarios and edge cases
- Expect strategic thinking and leadership examples
- Include advanced technical concepts and system design
- Test decision-making under pressure and ambiguous situations`;
      default:
        return '- Standard interview difficulty level';
    }
  }

  /**
   * Get role and industry specific guidance
   */
  private getRoleSpecificGuidance(role: string, industry: string): string {
    const roleGuides: Record<string, string> = {
      'software engineer': 'Focus on coding, algorithms, system design, debugging, code review processes',
      'marketing manager': 'Focus on campaign strategy, analytics, ROI, customer acquisition, brand management',
      'sales representative': 'Focus on sales process, objection handling, relationship building, quota achievement',
      'data scientist': 'Focus on statistical analysis, machine learning, data visualization, business insights',
      'product manager': 'Focus on product strategy, user research, roadmap planning, stakeholder management',
      'financial analyst': 'Focus on financial modeling, risk assessment, market analysis, reporting',
      'nurse': 'Focus on patient care, medical procedures, emergency response, healthcare protocols',
      'teacher': 'Focus on lesson planning, classroom management, student engagement, curriculum development',
      'designer': 'Focus on design process, user experience, visual communication, creative problem-solving',
    };

    const industryGuides: Record<string, string> = {
      'technology': 'Include questions about innovation, scalability, agile methodologies, technical trends',
      'healthcare': 'Include questions about patient safety, compliance, healthcare regulations, medical ethics',
      'finance': 'Include questions about risk management, regulatory compliance, financial markets, analysis',
      'education': 'Include questions about learning outcomes, student development, educational standards',
      'retail': 'Include questions about customer service, inventory management, sales metrics, market trends',
      'manufacturing': 'Include questions about quality control, process optimization, safety protocols',
    };

    const roleGuidance = roleGuides[role.toLowerCase()] || 'Focus on role-specific skills and responsibilities';
    const industryGuidance = industryGuides[industry.toLowerCase()] || 'Consider industry-specific challenges and requirements';
    
    return `${roleGuidance}\n${industryGuidance}`;
  }

  /**
   * Get question type specific guidance
   */
  private getQuestionTypeGuidance(questionType?: string): string {
    if (!questionType) {
      return 'Generate a mix of question types to assess different competencies';
    }

    switch (questionType) {
      case 'behavioral':
        return `- Use STAR method framework (Situation, Task, Action, Result)
- Ask about past experiences and specific examples
- Focus on soft skills, teamwork, leadership, problem-solving
- Examples: "Tell me about a time when...", "Describe a situation where..."`;
      case 'technical':
        return `- Ask about specific tools, technologies, and methodologies
- Include practical problem-solving scenarios
- Test depth of technical knowledge appropriate to the role
- May include coding challenges, system design, or technical explanations`;
      case 'situational':
        return `- Present hypothetical scenarios relevant to the role
- Ask "What would you do if..." questions
- Test decision-making and problem-solving approach
- Focus on how they would handle future challenges`;
      case 'cultural':
        return `- Ask about work style, values, and team fit
- Explore motivation, career goals, and company alignment
- Focus on personality, communication style, and adaptability
- Examples: "What motivates you?", "How do you prefer to work?"`;
      default:
        return 'Focus on the specified question type with relevant examples and scenarios';
    }
  }

  /**
   * Get appropriate time to answer based on difficulty
   */
  private getTimeToAnswer(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 90;   // 1.5 minutes
      case 'medium': return 120; // 2 minutes
      case 'hard': return 180;  // 3 minutes
      default: return 120;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export helper functions for API routes
export const generateInterviewQuestions = (params: QuestionGenerationParams) => 
  aiService.generateQuestions(params);

export const analyzeUserAnswer = (params: AnswerAnalysisParams) => 
  aiService.analyzeAnswer(params);

export const generateBuddyResponse = (context: string, message: string) => 
  aiService.generateBuddyResponse(context, message);

export default aiService;