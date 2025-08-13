import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  rateLimitResponse,
} from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'
import { validateRequestBody, questionGenerationSchema } from '../../../../lib/validation'
import { questionService, PromptLimitError, QuestionRequest } from '../../../../lib/ai/question-service'

// Helper function to get user from auth token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * POST /api/questions/generate
 * Generate new questions using AI with prompt limiting
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const body = await request.json()
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    questionGenerationSchema,
    body
  )
  
  if (validationError) {
    return validationErrorResponse({ body: [validationError] })
  }
  
  try {
    if (!supabaseAdmin) {
      return errorResponse("Database not configured", 500);
    }
    // Check user's subscription status
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        status,
        trial_end_date,
        current_period_end,
        subscription_plans (
          features
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['trial', 'active'])
      .single()
    
    if (!subscription) {
      return errorResponse('Subscription required for question generation', 403)
    }

    // Check if subscription is currently active
    const now = new Date();
    const isInTrial = subscription.status === 'trial' && 
                    subscription.trial_end_date && 
                    new Date(subscription.trial_end_date) > now;
    
    const isActive = subscription.status === 'active' && 
                    subscription.current_period_end && 
                    new Date(subscription.current_period_end) > now;

    if (!isInTrial && !isActive) {
      return errorResponse('Your subscription has expired. Please renew to continue generating questions.', 403);
    }
    
    // Get auth token for prompt tracking
    const authHeader = request.headers.get('authorization')
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : undefined
    
    if (!authToken) {
      return unauthorizedResponse('Authentication token required')
    }

    // Convert validated data to QuestionRequest format
    const questionRequest: QuestionRequest = {
      industry: validatedData.industry || validatedData.role || 'tech',
      experienceLevel: validatedData.experienceLevel || 'mid',
      questionType: validatedData.questionType || 'behavioral',
      difficulty: validatedData.difficulty || 'medium',
      specificRole: validatedData.role,
      companyType: validatedData.companyType
    };

    const questionCount = Math.min(validatedData.count || 1, 5); // Limit to max 5 questions

    // Generate questions using the AI service with prompt limiting
    const { questions, usage } = await questionService.generateQuestions(
      questionRequest, 
      questionCount,
      authToken
    );
    
    if (!questions || questions.length === 0) {
      return errorResponse('Failed to generate questions', 500);
    }

    // Transform questions to match database schema
    const questionsForDb = questions.map(q => ({
      question_type: q.category,
      role: questionRequest.specificRole || questionRequest.industry,
      experience_level: q.difficulty,
      difficulty: q.difficulty,
      title: `${q.category} Question for ${questionRequest.specificRole || questionRequest.industry}`,
      question_text: q.question,
      context: `Generated ${q.category} question for ${questionRequest.experienceLevel} level candidates`,
      sample_answer: q.tips.join(' '),
      evaluation_criteria: {
        clarity: 'Response should be clear and well-structured',
        relevance: `Answer should be relevant to ${q.category} scenarios`,
        depth: 'Should provide sufficient detail and examples',
        growth: 'Should demonstrate learning and improvement'
      },
      tags: [q.category, q.industry, q.difficulty],
      usage_count: 0,
      rating: 0,
      created_by: user.id,
      is_verified: false // AI-generated questions need verification
    }));
    
    // Cache generated questions in database
    const { data: savedQuestions, error: saveError } = await supabaseAdmin
      .from('questions')
      .insert(questionsForDb)
      .select('*')
    
    const responseData = {
      questions: savedQuestions || questions,
      usage: usage ? {
        remainingPrompts: usage.remainingPrompts,
        dailyLimit: usage.dailyLimit,
        todayCount: usage.todayCount,
        resetTime: usage.resetTime
      } : undefined
    };

    if (saveError) {
      console.warn('Failed to save generated questions:', saveError)
      // Return generated questions even if saving fails, but warn the user
      return successResponse(
        responseData,
        `${questions.length} questions generated successfully but not cached in database`
      )
    }
    
    return successResponse(
      responseData,
      `${questions.length} questions generated successfully`,
      undefined,
      201
    )
    
  } catch (error) {
    console.error('Generate questions error:', error)
    
    if (error instanceof PromptLimitError) {
      return rateLimitResponse(
        `Daily prompt limit exceeded. You can generate more questions after ${error.resetTime}`
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('prompt usage') || error.message.includes('limit')) {
        return rateLimitResponse(error.message);
      }
      if (error.message.includes('subscription')) {
        return errorResponse(error.message, 403);
      }
    }
    
    return errorResponse('Failed to generate questions', 500)
  }
})

// Helper function to get current prompt usage for response
async function getCurrentUsage(authToken: string): Promise<any> {
  try {
    const response = await fetch('/api/prompts/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.warn('Failed to get current usage:', error);
    return null;
  }
}

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}