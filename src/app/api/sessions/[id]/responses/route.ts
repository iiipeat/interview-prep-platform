import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  validateUUID,
} from '../../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../../lib/error-handler'
import { validateRequestBody, userResponseSchema } from '../../../../../lib/validation'

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
 * POST /api/sessions/[id]/responses
 * Submit a response to a question in the session
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const { id: sessionId } = params
  const body = await request.json()
  
  // Validate UUID format
  if (!validateUUID(sessionId)) {
    return errorResponse('Invalid session ID format', 400)
  }
  
  // Validate request body
  const { data: validatedData, error: validationError } = validateRequestBody(
    userResponseSchema.omit({ sessionId: true }),
    body
  )
  
  if (validationError) {
    return validationErrorResponse({ body: [validationError] })
  }
  
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
    }
    // Verify session belongs to user and is in progress
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('practice_sessions')
      .select('id, user_id, status, questions_answered, total_questions')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()
    
    if (sessionError) {
      return errorResponse('Session not found', 404)
    }
    
    if (session.status !== 'in_progress') {
      return errorResponse('Cannot add responses to completed session', 400)
    }
    
    // Check if response already exists for this question
    const { data: existingResponse } = await supabaseAdmin
      .from('user_responses')
      .select('id')
      .eq('session_id', sessionId)
      .eq('question_id', validatedData.questionId)
      .eq('user_id', user.id)
      .single()
    
    if (existingResponse) {
      return errorResponse('Response already exists for this question', 409)
    }
    
    // Create user response
    const { data: response, error: responseError } = await supabaseAdmin
      .from('user_responses')
      .insert({
        session_id: sessionId,
        question_id: validatedData.questionId,
        user_id: user.id,
        response_text: validatedData.responseText,
        response_audio_url: validatedData.responseAudioUrl,
        response_duration_seconds: validatedData.responseDurationSeconds,
        response_time_seconds: validatedData.responseTimeSeconds,
        question_rating: validatedData.questionRating,
      })
      .select(`
        *,
        questions (
          id,
          title,
          question_text,
          evaluation_criteria
        )
      `)
      .single()
    
    if (responseError) {
      return errorResponse('Failed to save response', 500)
    }
    
    // Update session progress
    const newQuestionsAnswered = session.questions_answered + 1
    const sessionUpdateData: any = {
      questions_answered: newQuestionsAnswered,
      updated_at: new Date().toISOString(),
    }
    
    // Auto-complete session if all questions answered
    if (newQuestionsAnswered >= session.total_questions) {
      sessionUpdateData.status = 'completed'
      sessionUpdateData.completed_at = new Date().toISOString()
    }
    
    await supabaseAdmin
      .from('practice_sessions')
      .update(sessionUpdateData)
      .eq('id', sessionId)
    
    // TODO: Generate AI feedback (placeholder for Alex's AI integration)
    // This would typically involve calling an AI service to analyze the response
    if (response.response_text) {
      const aiFeedback = await generateMockAIFeedback(response)
      
      // Update response with AI feedback
      await supabaseAdmin
        .from('user_responses')
        .update({
          ai_score: aiFeedback.score,
          ai_feedback: aiFeedback.feedback,
          strengths: aiFeedback.strengths,
          improvements: aiFeedback.improvements,
          updated_at: new Date().toISOString(),
        })
        .eq('id', response.id)
      
      response.ai_score = aiFeedback.score
      response.ai_feedback = aiFeedback.feedback
      response.strengths = aiFeedback.strengths
      response.improvements = aiFeedback.improvements
    }
    
    return successResponse(response, 'Response submitted successfully', undefined, 201)
    
  } catch (error) {
    console.error('Submit response error:', error)
    return errorResponse('Failed to submit response', 500)
  }
})

// Mock AI feedback generation (to be replaced by Alex's AI implementation)
async function generateMockAIFeedback(response: any) {
  // This is a placeholder that would be replaced with actual AI analysis
  const responseLength = response.response_text?.length || 0
  
  let score = Math.floor(Math.random() * 30) + 70 // Random score between 70-100
  let feedback = "Your response demonstrates good understanding of the question. "
  let strengths = ["Clear communication"]
  let improvements = ["Could provide more specific examples"]
  
  if (responseLength > 500) {
    score += 5
    feedback += "You provided comprehensive details which shows thorough thinking. "
    strengths.push("Detailed explanation")
  } else if (responseLength < 100) {
    score -= 10
    feedback += "Consider providing more detailed examples to strengthen your answer. "
    improvements.push("Add more specific details")
  }
  
  return {
    score: Math.min(100, score),
    feedback,
    strengths,
    improvements
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