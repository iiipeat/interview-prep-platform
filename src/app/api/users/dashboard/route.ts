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
 * GET /api/users/dashboard
 * Get user dashboard data including stats and recent activity
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await getUserFromToken(request)
  if (!user) {
    return unauthorizedResponse()
  }
  
  try {
    // Get user dashboard summary from view
    const { data: dashboardData, error: dashboardError } = await supabaseAdmin
      .from('user_dashboard_summary')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (dashboardError && dashboardError.code !== 'PGRST116') {
      console.error('Dashboard query error:', dashboardError)
    }
    
    // Get recent practice sessions
    const { data: recentSessions, error: sessionsError } = await supabaseAdmin
      .from('practice_sessions')
      .select(`
        id,
        session_type,
        target_role,
        difficulty,
        status,
        overall_score,
        total_questions,
        questions_answered,
        started_at,
        completed_at
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5)
    
    if (sessionsError) {
      console.error('Recent sessions query error:', sessionsError)
    }
    
    // Get recent achievements
    const { data: recentAchievements, error: achievementsError } = await supabaseAdmin
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(5)
    
    if (achievementsError) {
      console.error('Recent achievements query error:', achievementsError)
    }
    
    // Get current subscription status
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          features,
          max_sessions_per_day,
          max_questions_per_session
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['trial', 'active'])
      .single()
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Subscription query error:', subscriptionError)
    }
    
    // Get progress metrics for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: progressMetrics, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .gte('date_recorded', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date_recorded', { ascending: false })
    
    if (progressError) {
      console.error('Progress metrics query error:', progressError)
    }
    
    // Calculate streak days
    const streakMetric = progressMetrics?.find(m => m.metric_name === 'daily_sessions')
    const currentStreak = streakMetric?.metric_value || 0
    
    return successResponse({
      dashboard: dashboardData || {
        user_id: user.id,
        total_sessions: 0,
        avg_score: null,
        total_responses: 0,
        last_session_date: null,
      },
      recentSessions: recentSessions || [],
      recentAchievements: recentAchievements || [],
      subscription: subscription || null,
      progressMetrics: progressMetrics || [],
      stats: {
        totalSessions: dashboardData?.total_sessions || 0,
        averageScore: dashboardData?.avg_score || 0,
        totalResponses: dashboardData?.total_responses || 0,
        currentStreak: currentStreak,
        lastSessionDate: dashboardData?.last_session_date,
      },
    })
    
  } catch (error) {
    console.error('Get dashboard error:', error)
    return errorResponse('Failed to get dashboard data', 500)
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