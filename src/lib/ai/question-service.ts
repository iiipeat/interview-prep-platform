'use client';

export interface QuestionRequest {
  industry: string;
  experienceLevel: string;
  questionType: 'behavioral' | 'situational' | 'technical' | 'culture-fit';
  difficulty: 'easy' | 'medium' | 'hard';
  specificRole?: string;
  companyType?: string;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  industry: string;
  tips: string[];
  followUpQuestions?: string[];
  expectedElements: string[];
}

export interface PromptUsageInfo {
  todayCount: number;
  dailyLimit: number;
  remainingPrompts: number;
  canMakePrompt: boolean;
  resetTime: string;
  date: string;
}

export class PromptLimitError extends Error {
  constructor(public remainingPrompts: number, public resetTime: string) {
    super(`Daily prompt limit exceeded. Resets at ${resetTime}`);
    this.name = 'PromptLimitError';
  }
}

class QuestionService {
  private apiKey: string | null = null;

  constructor() {
    // In production, this would come from environment variables
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY || null;
  }

  /**
   * Check if user can make a prompt without incrementing the counter
   */
  async checkPromptUsage(authToken: string): Promise<PromptUsageInfo> {
    const response = await fetch('/api/prompts/usage', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check prompt usage');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to check prompt usage');
    }

    if (!data.data.canMakePrompt) {
      throw new PromptLimitError(0, data.data.usage?.resetTime || 'unknown');
    }

    return data.data.usage || {
      todayCount: 0,
      dailyLimit: 20,
      remainingPrompts: 20,
      canMakePrompt: true,
      resetTime: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Increment prompt usage counter after successful generation
   */
  async trackPromptUsage(authToken: string): Promise<PromptUsageInfo> {
    const response = await fetch('/api/prompts/usage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to track prompt usage');
    }

    const data = await response.json();
    
    if (!data.success) {
      if (response.status === 429) {
        throw new PromptLimitError(0, 'unknown');
      }
      throw new Error(data.error || 'Failed to track prompt usage');
    }

    return data.data.usage || {
      todayCount: 1,
      dailyLimit: 20,
      remainingPrompts: 19,
      canMakePrompt: true,
      resetTime: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };
  }

  async generateQuestions(
    request: QuestionRequest, 
    count: number = 1, 
    authToken?: string
  ): Promise<{ questions: GeneratedQuestion[], usage?: PromptUsageInfo }> {
    // For now, always use mock questions since API is not configured
    console.log('Using mock question generation');
    const questions = this.generateMockQuestions(request, count);
    
    // Return consistent format
    return { 
      questions,
      usage: {
        todayCount: 1,
        dailyLimit: 20,
        remainingPrompts: 19,
        canMakePrompt: true,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        date: new Date().toISOString().split('T')[0]
      }
    };
  }

  private buildQuestionPrompt(request: QuestionRequest, count: number): string {
    return `Generate ${count} interview question(s) for the following context:

Industry: ${request.industry}
Experience Level: ${request.experienceLevel}
Question Type: ${request.questionType}
Difficulty: ${request.difficulty}
${request.specificRole ? `Specific Role: ${request.specificRole}` : ''}
${request.companyType ? `Company Type: ${request.companyType}` : ''}

For each question, provide:
1. The interview question
2. 3-4 tips for answering effectively
3. Key elements that should be included in a strong answer
4. 1-2 potential follow-up questions an interviewer might ask

Format the response as JSON with this structure:
[
  {
    "question": "the interview question",
    "tips": ["tip1", "tip2", "tip3"],
    "expectedElements": ["element1", "element2", "element3"],
    "followUpQuestions": ["follow-up1", "follow-up2"]
  }
]

Make the questions realistic, relevant to the ${request.industry} industry, and appropriate for ${request.experienceLevel} level candidates. Ensure questions test real skills and scenarios they would encounter in this role.`;
  }

  private parseGeneratedQuestions(generatedText: string, request: QuestionRequest): GeneratedQuestion[] {
    try {
      // Clean up the generated text and try to parse JSON
      const cleanText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      return (Array.isArray(parsed) ? parsed : [parsed]).map((q, index) => ({
        id: `ai-${Date.now()}-${index}`,
        question: q.question || 'Generated question',
        category: request.questionType,
        difficulty: request.difficulty,
        industry: request.industry,
        tips: q.tips || [],
        followUpQuestions: q.followUpQuestions || [],
        expectedElements: q.expectedElements || []
      }));
    } catch (error) {
      console.error('Error parsing generated questions:', error);
      return this.generateMockQuestions(request, 1);
    }
  }

  private generateMockQuestions(request: QuestionRequest, count: number): GeneratedQuestion[] {
    const mockQuestions: Record<string, Record<string, string[]>> = {
      tech: {
        behavioral: [
          "Tell me about a time when you had to learn a new technology quickly to complete a project.",
          "Describe a situation where you had to debug a particularly challenging problem.",
          "Give me an example of when you had to collaborate with a difficult team member."
        ],
        situational: [
          "How would you handle a situation where your code deployment caused a production outage?",
          "What would you do if you disagreed with a technical decision made by your team lead?",
          "How would you approach optimizing a slow-performing application?"
        ],
        technical: [
          "Explain the difference between synchronous and asynchronous programming.",
          "How would you design a system to handle 1 million concurrent users?",
          "Walk me through how you would implement a caching strategy."
        ]
      },
      retail: {
        behavioral: [
          "Tell me about a time when you went above and beyond for a customer.",
          "Describe a situation where you had to handle an upset customer.",
          "Give me an example of when you had to work as part of a team to achieve a goal."
        ],
        situational: [
          "How would you handle a situation where a customer wants to return an item without a receipt?",
          "What would you do if you noticed a coworker not following company policies?",
          "How would you approach increasing sales in a underperforming department?"
        ]
      },
      healthcare: {
        behavioral: [
          "Tell me about a time when you had to deliver difficult news to a patient or family.",
          "Describe a situation where you had to work under extreme pressure.",
          "Give me an example of when you made a mistake and how you handled it."
        ],
        situational: [
          "How would you handle a situation where a patient refuses treatment?",
          "What would you do if you disagreed with a colleague's treatment approach?",
          "How would you manage competing priorities during a busy shift?"
        ]
      }
    };

    const industryQuestions = mockQuestions[request.industry] || mockQuestions.tech;
    const typeQuestions = industryQuestions[request.questionType] || industryQuestions.behavioral || [];
    
    const questions: GeneratedQuestion[] = [];
    
    for (let i = 0; i < count && i < typeQuestions.length; i++) {
      const question = typeQuestions[i % typeQuestions.length];
      
      questions.push({
        id: `q-${Date.now()}-${i}`,
        question,
        category: request.questionType,
        difficulty: request.difficulty,
        industry: request.industry,
        tips: this.generateMockTips(request.questionType),
        followUpQuestions: this.generateMockFollowUps(request.questionType),
        expectedElements: this.generateMockElements(request.questionType)
      });
    }
    
    return questions;
  }

  private generateMockTips(questionType: string): string[] {
    const tipsByType: Record<string, string[]> = {
      behavioral: [
        "Use the STAR method (Situation, Task, Action, Result)",
        "Be specific with examples and quantify results when possible",
        "Focus on your role and contributions",
        "Keep your answer concise but comprehensive"
      ],
      situational: [
        "Think through the problem step by step",
        "Consider multiple stakeholders and perspectives",
        "Explain your reasoning clearly",
        "Show how you would follow up and measure success"
      ],
      technical: [
        "Start with the basics and build up complexity",
        "Use concrete examples to illustrate concepts",
        "Discuss trade-offs and alternatives",
        "Be honest about areas you're still learning"
      ],
      'culture-fit': [
        "Align your answer with the company's values",
        "Show genuine enthusiasm for the role",
        "Demonstrate self-awareness and growth mindset",
        "Give specific examples that show cultural alignment"
      ]
    };

    return tipsByType[questionType] || tipsByType.behavioral;
  }

  private generateMockFollowUps(questionType: string): string[] {
    const followUpsByType: Record<string, string[]> = {
      behavioral: [
        "What would you do differently if you faced this situation again?",
        "How did this experience change your approach to similar challenges?"
      ],
      situational: [
        "What if you had limited resources to solve this problem?",
        "How would you handle pushback from stakeholders?"
      ],
      technical: [
        "How would you scale this solution?",
        "What are the potential downsides of this approach?"
      ],
      'culture-fit': [
        "Can you give me another example of this value in action?",
        "How do you see this fitting with our team dynamics?"
      ]
    };

    return followUpsByType[questionType] || followUpsByType.behavioral;
  }

  private generateMockElements(questionType: string): string[] {
    const elementsByType: Record<string, string[]> = {
      behavioral: [
        "Clear situation setup",
        "Specific actions taken",
        "Measurable results",
        "Lessons learned"
      ],
      situational: [
        "Problem analysis",
        "Solution approach",
        "Implementation plan",
        "Success metrics"
      ],
      technical: [
        "Accurate technical knowledge",
        "Clear explanations",
        "Real-world application",
        "Understanding of limitations"
      ],
      'culture-fit': [
        "Authentic examples",
        "Company value alignment",
        "Personal growth mindset",
        "Team collaboration focus"
      ]
    };

    return elementsByType[questionType] || elementsByType.behavioral;
  }
}

export const questionService = new QuestionService();