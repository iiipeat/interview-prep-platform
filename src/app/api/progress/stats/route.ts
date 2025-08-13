import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
} from '../../../../lib/api-helpers'
import { withErrorHandler } from '../../../../lib/error-handler'

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
 * GET /api/progress/stats
 * Get comprehensive user statistics and analytics
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30' // days
  
  try {
    if (!supabaseAdmin) {
      return errorResponse("Database not configured", 500);
    }
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(period))
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    // Get session statistics
    const { data: sessionStats, error: sessionError } = await supabaseAdmin
      .from('practice_sessions')
      .select('status, overall_score, started_at, completed_at')
      .eq('user_id', user.id)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
    
    if (sessionError) {
      console.error('Session stats error:', sessionError)
    }
    
    // Get response statistics
    const { data: responseStats, error: responseError } = await supabaseAdmin
      .from('user_responses')
      .select('ai_score, response_time_seconds, question_rating, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    
    if (responseError) {
      console.error('Response stats error:', responseError)
    }
    
    // Get progress metrics for the period
    const { data: progressMetrics, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .gte('date_recorded', startDateStr)
      .lte('date_recorded', endDateStr)
      .order('date_recorded', { ascending: true })
    
    if (progressError) {
      console.error('Progress metrics error:', progressError)
    }
    
    // Calculate statistics
    const sessions = sessionStats || []
    const responses = responseStats || []
    
    // Session statistics
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    const averageScore = completedSessions > 0 
      ? sessions
          .filter(s => s.overall_score !== null)
          .reduce((sum, s) => sum + (s.overall_score || 0), 0) / completedSessions
      : 0
    
    // Response statistics
    const totalResponses = responses.length
    const averageResponseScore = totalResponses > 0
      ? responses
          .filter(r => r.ai_score !== null)
          .reduce((sum, r) => sum + (r.ai_score || 0), 0) / totalResponses
      : 0
    
    const averageResponseTime = totalResponses > 0
      ? responses
          .filter(r => r.response_time_seconds !== null)
          .reduce((sum, r) => sum + (r.response_time_seconds || 0), 0) / totalResponses
      : 0
    
    // Calculate streak (consecutive days with sessions)
    let currentStreak = 0
    let longestStreak = 0
    let streakCount = 0
    
    // Group sessions by date
    const sessionsByDate = sessions.reduce((acc, session) => {
      const date = session.started_at.split('T')[0]
      if (!acc[date]) acc[date] = 0
      acc[date]++
      return acc
    }, {} as Record<string, number>)
    
    // Calculate streaks
    let checkDate = new Date()
    while (checkDate >= startDate) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (sessionsByDate[dateStr] && sessionsByDate[dateStr] > 0) {
        streakCount++
        if (checkDate.toDateString() === new Date().toDateString()) {
          currentStreak = streakCount
        }
      } else {
        if (streakCount > longestStreak) {
          longestStreak = streakCount
        }
        if (checkDate.toDateString() === new Date().toDateString()) {
          currentStreak = 0
        }
        streakCount = 0
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    longestStreak = Math.max(longestStreak, streakCount)
    
    // Improvement trends (compare first half vs second half of period)
    const halfPeriod = Math.floor(parseInt(period) / 2)
    const midDate = new Date()
    midDate.setDate(endDate.getDate() - halfPeriod)
    
    const firstHalfResponses = responses.filter(r => new Date(r.created_at) < midDate)
    const secondHalfResponses = responses.filter(r => new Date(r.created_at) >= midDate)
    
    const firstHalfAvgScore = firstHalfResponses.length > 0
      ? firstHalfResponses.reduce((sum, r) => sum + (r.ai_score || 0), 0) / firstHalfResponses.length
      : 0
    
    const secondHalfAvgScore = secondHalfResponses.length > 0
      ? secondHalfResponses.reduce((sum, r) => sum + (r.ai_score || 0), 0) / secondHalfResponses.length
      : 0
    
    const improvementTrend = secondHalfAvgScore - firstHalfAvgScore
    
    // Recent achievements count
    const { count: recentAchievements } = await supabaseAdmin
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('earned_at', startDate.toISOString())
    
    // Performance by question type
    const { data: questionTypeStats, error: questionTypeError } = await supabaseAdmin
      .from('user_responses')
      .select(`
        ai_score,
        questions!inner (
          question_type,
          difficulty
        )
      `)
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    
    const performanceByType = (questionTypeStats || []).reduce((acc, response) => {
      const questionType = response.questions.question_type
      const difficulty = response.questions.difficulty
      const score = response.ai_score || 0
      
      if (!acc[questionType]) {
        acc[questionType] = { totalScore: 0, count: 0, avgScore: 0, byDifficulty: {} }
      }
      
      acc[questionType].totalScore += score
      acc[questionType].count += 1
      acc[questionType].avgScore = acc[questionType].totalScore / acc[questionType].count
      
      if (!acc[questionType].byDifficulty[difficulty]) {
        acc[questionType].byDifficulty[difficulty] = { totalScore: 0, count: 0, avgScore: 0 }
      }
      
      acc[questionType].byDifficulty[difficulty].totalScore += score
      acc[questionType].byDifficulty[difficulty].count += 1
      acc[questionType].byDifficulty[difficulty].avgScore = 
        acc[questionType].byDifficulty[difficulty].totalScore / acc[questionType].byDifficulty[difficulty].count
      
      return acc
    }, {} as Record<string, any>)
    
    return successResponse({
      period: parseInt(period),
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
        averageScore: Math.round(averageScore * 100) / 100,
      },
      responses: {
        total: totalResponses,
        averageScore: Math.round(averageResponseScore * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime),
      },
      streaks: {
        current: currentStreak,
        longest: longestStreak,
      },
      improvement: {
        trend: Math.round(improvementTrend * 100) / 100,
        isImproving: improvementTrend > 0,
      },
      achievements: {
        recentCount: recentAchievements || 0,
      },
      performanceByQuestionType: performanceByType,
      progressMetrics: progressMetrics || [],
    })
    
  } catch (error) {
    console.error('Get stats error:', error)
    return errorResponse('Failed to get statistics', 500)
  }
})

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}