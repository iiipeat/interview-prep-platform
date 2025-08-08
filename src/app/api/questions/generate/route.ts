import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { validateRequestBody, questionGenerationSchema } from '@/lib/validation'

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
 * Generate new questions using AI (placeholder for Alex's AI integration)
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
    // Check user's subscription limits
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        status,
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
    
    // TODO: Check daily generation limits based on subscription plan
    
    // For now, return mock generated questions
    // Alex will replace this with actual AI generation
    const mockQuestions = await generateMockQuestions(validatedData)
    
    // Cache generated questions in database
    const { data: savedQuestions, error: saveError } = await supabaseAdmin
      .from('questions')
      .insert(
        mockQuestions.map(q => ({
          ...q,
          created_by: user.id,
          is_verified: false, // AI-generated questions need verification
        }))
      )
      .select('*')
    
    if (saveError) {
      console.error('Failed to save generated questions:', saveError)
      // Return generated questions even if saving fails
      return successResponse(mockQuestions, 'Questions generated but not cached')
    }
    
    return successResponse(
      savedQuestions, 
      `${savedQuestions.length} questions generated successfully`,
      undefined,
      201
    )
    
  } catch (error) {
    console.error('Generate questions error:', error)
    return errorResponse('Failed to generate questions', 500)
  }
})

// Mock question generation (to be replaced by Alex's AI implementation)
async function generateMockQuestions(params: any) {
  const { role, experienceLevel, questionType, difficulty, count } = params
  
  const mockQuestions = []
  
  for (let i = 0; i < count; i++) {
    const question = {
      question_type: questionType,
      role: role,
      experience_level: experienceLevel,
      difficulty: difficulty,
      title: `${questionType} Question for ${role} (${experienceLevel})`,
      question_text: `This is a mock ${questionType} question for a ${experienceLevel} ${role} position. Tell me about a time when you...`,
      context: `This question is designed to assess ${questionType} skills for ${experienceLevel} level candidates.`,
      sample_answer: `A good answer would include specific examples, demonstrate ${questionType} thinking, and show growth mindset.`,
      evaluation_criteria: {
        clarity: 'Response should be clear and well-structured',
        relevance: 'Answer should be relevant to the role and level',
        depth: 'Should provide sufficient detail and examples',
        growth: 'Should demonstrate learning and improvement'
      },
      tags: [questionType, role.toLowerCase(), experienceLevel],
      usage_count: 0,
      rating: 0
    }
    
    mockQuestions.push(question)
  }
  
  return mockQuestions
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