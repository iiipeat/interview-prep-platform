// Dynamic import to avoid build errors when package is not installed
let AnthropicSDK: any = null;
let anthropic: any = null;

// Try to load Anthropic SDK if available
if (typeof window === 'undefined') {
  try {
    AnthropicSDK = require('@anthropic-ai/sdk');
    if (process.env.ANTHROPIC_API_KEY) {
      anthropic = new AnthropicSDK.default({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  } catch (error) {
    console.log('Anthropic SDK not installed, using mock data');
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
  private anthropicClient: any;

  constructor() {
    this.anthropicClient = anthropic;
  }

  /**
   * Generate interview questions using Claude API
   */
  async generateQuestions(params: QuestionGenerationParams): Promise<GeneratedQuestion[]> {
    if (!this.anthropicClient) {
      // Fallback to mock questions if API not configured
      return this.generateMockQuestions(params);
    }

    try {
      const prompt = this.buildQuestionPrompt(params);
      
      const response = await this.anthropicClient.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Parse the response and extract questions
      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseQuestionResponse(content);
    } catch (error) {
      console.error('Error generating questions with Claude:', error);
      return this.generateMockQuestions(params);
    }
  }

  /**
   * Analyze user's answer and provide feedback
   */
  async analyzeAnswer(params: AnswerAnalysisParams): Promise<AnswerFeedback> {
    if (!this.anthropicClient) {
      // Fallback to mock feedback if API not configured
      return this.generateMockFeedback(params);
    }

    try {
      const prompt = this.buildFeedbackPrompt(params);
      
      const response = await this.anthropicClient.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseFeedbackResponse(content);
    } catch (error) {
      console.error('Error analyzing answer with Claude:', error);
      return this.generateMockFeedback(params);
    }
  }

  /**
   * Generate a practice buddy response
   */
  async generateBuddyResponse(context: string, userMessage: string): Promise<string> {
    if (!this.anthropicClient) {
      return "Great point! Let me think about that...";
    }

    try {
      const response = await this.anthropicClient.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: `You are a practice interview partner. Context: ${context}\n\nUser said: ${userMessage}\n\nProvide a helpful, encouraging response as their practice partner:`,
          },
        ],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      console.error('Error generating buddy response:', error);
      return "That's interesting! Can you elaborate more on that?";
    }
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionPrompt(params: QuestionGenerationParams): string {
    return `Generate ${params.count || 1} interview questions for a ${params.experienceLevel} level ${params.role} position in the ${params.industry} industry.

Requirements:
- Difficulty level: ${params.difficulty}
${params.questionType ? `- Question type: ${params.questionType}` : '- Mix of behavioral, technical, situational, and cultural questions'}
- Make questions specific and relevant to the role and industry
- Include practical scenarios when appropriate
${params.previousQuestions ? `- Avoid these previously asked questions: ${params.previousQuestions.join(', ')}` : ''}

For each question, provide in JSON format:
{
  "question": "The interview question",
  "type": "behavioral|technical|situational|cultural",
  "difficulty": "easy|medium|hard",
  "category": "Category name",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "evaluationCriteria": ["Criteria 1", "Criteria 2"],
  "followUpQuestions": ["Follow-up 1", "Follow-up 2"],
  "timeToAnswer": 120
}

Generate the questions now:`;
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
    
    const templates = {
      behavioral: [
        'Tell me about a time when you had to overcome a significant challenge.',
        'Describe a situation where you demonstrated leadership.',
        'Give an example of how you handled conflict with a colleague.',
      ],
      technical: [
        `What are the key technical skills required for a ${params.role}?`,
        `How would you approach solving a complex problem in ${params.industry}?`,
        'Explain your experience with relevant tools and technologies.',
      ],
      situational: [
        'How would you handle competing priorities with tight deadlines?',
        'What would you do if you disagreed with your manager?',
        'How would you approach learning a new skill quickly?',
      ],
      cultural: [
        'What type of work environment do you thrive in?',
        'How do you stay motivated during challenging projects?',
        'What are your long-term career goals?',
      ],
    };
    
    for (let i = 0; i < count; i++) {
      const type = params.questionType || (['behavioral', 'technical', 'situational', 'cultural'][i % 4] as any);
      const questionSet = templates[type];
      const question = questionSet[Math.floor(Math.random() * questionSet.length)];
      
      questions.push({
        question,
        type,
        difficulty: params.difficulty,
        category: type.charAt(0).toUpperCase() + type.slice(1),
        tips: [
          'Use specific examples',
          'Be concise but thorough',
          'Show enthusiasm',
        ],
        evaluationCriteria: [
          'Clarity of communication',
          'Relevance to the role',
          'Demonstration of skills',
        ],
        timeToAnswer: 120,
      });
    }
    
    return questions;
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