/**
 * Smart Question Difficulty Engine
 * Adaptively adjusts question difficulty based on user performance
 */

export interface UserPerformance {
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  averageTimePerQuestion: number; // in seconds
  averageConfidenceScore: number; // 0-1
  currentDifficulty: number; // 1-10
  recentPerformance: QuestionResult[]; // Last 10 questions
}

export interface QuestionResult {
  questionId: string;
  difficulty: number;
  wasCorrect: boolean;
  timeSpent: number;
  confidenceScore: number;
  timestamp: Date;
}

export interface DifficultyAdjustment {
  newDifficulty: number;
  reason: string;
  performanceMetrics: {
    successRate: number;
    avgTimeRatio: number; // actual time / expected time
    confidenceTrend: 'improving' | 'stable' | 'declining';
  };
}

export class DifficultyEngine {
  // Ideal success rate for optimal learning
  private readonly TARGET_SUCCESS_RATE = 0.75; // 75%
  private readonly SUCCESS_RATE_TOLERANCE = 0.05; // ±5%
  
  // Difficulty adjustment parameters
  private readonly MAX_DIFFICULTY_CHANGE = 0.5; // Per session
  private readonly MIN_QUESTIONS_FOR_ADJUSTMENT = 3;
  
  // Time expectations per difficulty level (in seconds)
  private readonly TIME_EXPECTATIONS: Record<number, number> = {
    1: 30,
    2: 45,
    3: 60,
    4: 90,
    5: 120,
    6: 150,
    7: 180,
    8: 240,
    9: 300,
    10: 360,
  };

  /**
   * Calculate the next appropriate difficulty level for a user
   */
  calculateNextDifficulty(performance: UserPerformance): DifficultyAdjustment {
    // Not enough data to adjust
    if (performance.recentPerformance.length < this.MIN_QUESTIONS_FOR_ADJUSTMENT) {
      return {
        newDifficulty: performance.currentDifficulty || 5,
        reason: 'Insufficient data for adjustment',
        performanceMetrics: {
          successRate: 0,
          avgTimeRatio: 1,
          confidenceTrend: 'stable',
        },
      };
    }

    // Calculate metrics
    const metrics = this.calculatePerformanceMetrics(performance);
    const adjustment = this.determineAdjustment(metrics, performance.currentDifficulty);

    return {
      newDifficulty: adjustment.newDifficulty,
      reason: adjustment.reason,
      performanceMetrics: metrics,
    };
  }

  /**
   * Calculate performance metrics from recent results
   */
  private calculatePerformanceMetrics(performance: UserPerformance) {
    const recent = performance.recentPerformance.slice(-10); // Last 10 questions
    
    // Success rate
    const successRate = recent.filter(r => r.wasCorrect).length / recent.length;
    
    // Time ratio (how long they take vs expected)
    const avgTimeRatio = recent.reduce((sum, result) => {
      const expectedTime = this.TIME_EXPECTATIONS[Math.round(result.difficulty)] || 120;
      return sum + (result.timeSpent / expectedTime);
    }, 0) / recent.length;
    
    // Confidence trend
    const confidenceTrend = this.calculateConfidenceTrend(recent);
    
    return {
      successRate,
      avgTimeRatio,
      confidenceTrend,
    };
  }

  /**
   * Calculate confidence trend over recent questions
   */
  private calculateConfidenceTrend(
    recent: QuestionResult[]
  ): 'improving' | 'stable' | 'declining' {
    if (recent.length < 3) return 'stable';
    
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, r) => sum + r.confidenceScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r.confidenceScore, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Determine difficulty adjustment based on metrics
   */
  private determineAdjustment(
    metrics: {
      successRate: number;
      avgTimeRatio: number;
      confidenceTrend: 'improving' | 'stable' | 'declining';
    },
    currentDifficulty: number
  ): { newDifficulty: number; reason: string } {
    let adjustment = 0;
    const reasons: string[] = [];

    // Success rate analysis
    if (metrics.successRate > this.TARGET_SUCCESS_RATE + this.SUCCESS_RATE_TOLERANCE) {
      // Too easy - increase difficulty
      adjustment += 0.3;
      reasons.push(`High success rate (${(metrics.successRate * 100).toFixed(0)}%)`);
      
      if (metrics.successRate > 0.9) {
        adjustment += 0.2; // Extra boost if very high success
        reasons.push('Very high performance');
      }
    } else if (metrics.successRate < this.TARGET_SUCCESS_RATE - this.SUCCESS_RATE_TOLERANCE) {
      // Too hard - decrease difficulty
      adjustment -= 0.3;
      reasons.push(`Low success rate (${(metrics.successRate * 100).toFixed(0)}%)`);
      
      if (metrics.successRate < 0.5) {
        adjustment -= 0.2; // Extra reduction if struggling
        reasons.push('Struggling with current level');
      }
    }

    // Time analysis
    if (metrics.avgTimeRatio < 0.7) {
      // Answering too quickly - might be too easy
      adjustment += 0.1;
      reasons.push('Quick response times');
    } else if (metrics.avgTimeRatio > 1.3) {
      // Taking too long - might be too hard
      adjustment -= 0.1;
      reasons.push('Extended response times');
    }

    // Confidence trend analysis
    if (metrics.confidenceTrend === 'improving' && metrics.successRate > 0.7) {
      adjustment += 0.1;
      reasons.push('Growing confidence');
    } else if (metrics.confidenceTrend === 'declining' && metrics.successRate < 0.7) {
      adjustment -= 0.1;
      reasons.push('Declining confidence');
    }

    // Apply limits
    adjustment = Math.max(-this.MAX_DIFFICULTY_CHANGE, Math.min(this.MAX_DIFFICULTY_CHANGE, adjustment));
    
    // Calculate new difficulty
    let newDifficulty = currentDifficulty + adjustment;
    newDifficulty = Math.max(1, Math.min(10, newDifficulty)); // Keep within 1-10
    newDifficulty = Math.round(newDifficulty * 2) / 2; // Round to nearest 0.5

    // Generate reason string
    const reason = reasons.length > 0 
      ? reasons.join(', ') 
      : 'Performance is optimal at current level';

    return { newDifficulty, reason };
  }

  /**
   * Get recommended question parameters based on difficulty
   */
  getQuestionParameters(difficulty: number): {
    complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
    timeLimit: number;
    followUpCount: number;
    requiresExamples: boolean;
    requiresAnalysis: boolean;
  } {
    if (difficulty <= 2.5) {
      return {
        complexity: 'basic',
        timeLimit: 60,
        followUpCount: 0,
        requiresExamples: false,
        requiresAnalysis: false,
      };
    } else if (difficulty <= 5) {
      return {
        complexity: 'intermediate',
        timeLimit: 120,
        followUpCount: 1,
        requiresExamples: true,
        requiresAnalysis: false,
      };
    } else if (difficulty <= 7.5) {
      return {
        complexity: 'advanced',
        timeLimit: 180,
        followUpCount: 2,
        requiresExamples: true,
        requiresAnalysis: true,
      };
    } else {
      return {
        complexity: 'expert',
        timeLimit: 300,
        followUpCount: 3,
        requiresExamples: true,
        requiresAnalysis: true,
      };
    }
  }

  /**
   * Analyze a user's answer and provide a confidence score
   */
  analyzeAnswerConfidence(answer: string, expectedKeywords: string[]): number {
    const answerLower = answer.toLowerCase();
    const wordCount = answer.split(/\s+/).length;
    
    // Check for keyword presence
    const keywordMatches = expectedKeywords.filter(keyword => 
      answerLower.includes(keyword.toLowerCase())
    ).length;
    const keywordScore = keywordMatches / expectedKeywords.length;
    
    // Check answer length (ideal is 100-300 words)
    let lengthScore = 1;
    if (wordCount < 50) lengthScore = 0.5;
    else if (wordCount < 100) lengthScore = 0.75;
    else if (wordCount > 400) lengthScore = 0.85;
    
    // Check for structure (STAR method indicators)
    const hasStructure = 
      answerLower.includes('situation') ||
      answerLower.includes('task') ||
      answerLower.includes('action') ||
      answerLower.includes('result') ||
      (answerLower.includes('first') && answerLower.includes('then') && answerLower.includes('finally'));
    const structureScore = hasStructure ? 1 : 0.7;
    
    // Combine scores with weights
    const confidenceScore = 
      (keywordScore * 0.4) + 
      (lengthScore * 0.3) + 
      (structureScore * 0.3);
    
    return Math.min(1, Math.max(0, confidenceScore));
  }

  /**
   * Get personalized encouragement based on performance
   */
  getEncouragement(metrics: {
    successRate: number;
    confidenceTrend: 'improving' | 'stable' | 'declining';
  }): string {
    if (metrics.successRate > 0.8 && metrics.confidenceTrend === 'improving') {
      return "Excellent work! You're mastering these questions. Ready for a challenge?";
    } else if (metrics.successRate > 0.7) {
      return "Great job! You're in the optimal learning zone.";
    } else if (metrics.successRate > 0.5 && metrics.confidenceTrend === 'improving') {
      return "You're improving! Keep up the momentum.";
    } else if (metrics.successRate > 0.5) {
      return "You're doing well. Focus on structure and key points.";
    } else if (metrics.confidenceTrend === 'improving') {
      return "Don't give up! Your confidence is growing, and success will follow.";
    } else {
      return "Take your time. Remember to use the STAR method for behavioral questions.";
    }
  }
}

// Export singleton instance
export const difficultyEngine = new DifficultyEngine();

// Helper function for API routes
export async function adjustUserDifficulty(
  userId: string,
  performance: UserPerformance
): Promise<DifficultyAdjustment> {
  return difficultyEngine.calculateNextDifficulty(performance);
}