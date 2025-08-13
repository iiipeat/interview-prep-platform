// Import real Supabase client
import { supabase as supabaseClient, supabaseAdmin as admin } from './supabase-client'

export const supabase = supabaseClient
export const supabaseAdmin = admin

/**
 * Database type definitions based on schema
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          provider: string
          provider_id: string | null
          is_active: boolean
          email_verified: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string
          provider_id?: string | null
          is_active?: boolean
          email_verified?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          provider?: string
          provider_id?: string | null
          is_active?: boolean
          email_verified?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          current_job_role: string | null
          target_role: string | null
          experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
          industry: string | null
          skills: string[] | null
          career_goals: string | null
          user_location: string | null
          user_timezone: string | null
          preferred_difficulty: 'easy' | 'medium' | 'hard' | 'mixed' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_job_role?: string | null
          target_role?: string | null
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
          industry?: string | null
          skills?: string[] | null
          career_goals?: string | null
          user_location?: string | null
          user_timezone?: string | null
          preferred_difficulty?: 'easy' | 'medium' | 'hard' | 'mixed' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_job_role?: string | null
          target_role?: string | null
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
          industry?: string | null
          skills?: string[] | null
          career_goals?: string | null
          user_location?: string | null
          user_timezone?: string | null
          preferred_difficulty?: 'easy' | 'medium' | 'hard' | 'mixed' | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_monthly: number | null
          price_weekly: number | null
          features: any
          max_sessions_per_day: number | null
          max_questions_per_session: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_monthly?: number | null
          price_weekly?: number | null
          features?: any
          max_sessions_per_day?: number | null
          max_questions_per_session?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_monthly?: number | null
          price_weekly?: number | null
          features?: any
          max_sessions_per_day?: number | null
          max_questions_per_session?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'trial' | 'active' | 'canceled' | 'expired' | 'past_due'
          trial_start_date: string | null
          trial_end_date: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: 'trial' | 'active' | 'canceled' | 'expired' | 'past_due'
          trial_start_date?: string | null
          trial_end_date?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: 'trial' | 'active' | 'canceled' | 'expired' | 'past_due'
          trial_start_date?: string | null
          trial_end_date?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      question_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          category_id: string | null
          question_type: 'behavioral' | 'technical' | 'situational' | 'case_study'
          role: string | null
          experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
          difficulty: 'easy' | 'medium' | 'hard' | null
          title: string
          question_text: string
          context: string | null
          sample_answer: string | null
          evaluation_criteria: any | null
          tags: string[] | null
          usage_count: number
          rating: number
          is_verified: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          question_type: 'behavioral' | 'technical' | 'situational' | 'case_study'
          role?: string | null
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
          difficulty?: 'easy' | 'medium' | 'hard' | null
          title: string
          question_text: string
          context?: string | null
          sample_answer?: string | null
          evaluation_criteria?: any | null
          tags?: string[] | null
          usage_count?: number
          rating?: number
          is_verified?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          question_type?: 'behavioral' | 'technical' | 'situational' | 'case_study'
          role?: string | null
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
          difficulty?: 'easy' | 'medium' | 'hard' | null
          title?: string
          question_text?: string
          context?: string | null
          sample_answer?: string | null
          evaluation_criteria?: any | null
          tags?: string[] | null
          usage_count?: number
          rating?: number
          is_verified?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      practice_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: 'quick' | 'full' | 'custom' | 'mock_interview'
          target_role: string | null
          difficulty: 'easy' | 'medium' | 'hard' | 'mixed' | null
          duration_minutes: number | null
          status: 'in_progress' | 'completed' | 'abandoned'
          total_questions: number
          questions_answered: number
          overall_score: number | null
          feedback_summary: string | null
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type: 'quick' | 'full' | 'custom' | 'mock_interview'
          target_role?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'mixed' | null
          duration_minutes?: number | null
          status?: 'in_progress' | 'completed' | 'abandoned'
          total_questions?: number
          questions_answered?: number
          overall_score?: number | null
          feedback_summary?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: 'quick' | 'full' | 'custom' | 'mock_interview'
          target_role?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'mixed' | null
          duration_minutes?: number | null
          status?: 'in_progress' | 'completed' | 'abandoned'
          total_questions?: number
          questions_answered?: number
          overall_score?: number | null
          feedback_summary?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_responses: {
        Row: {
          id: string
          session_id: string
          question_id: string
          user_id: string
          response_text: string | null
          response_audio_url: string | null
          response_duration_seconds: number | null
          ai_score: number | null
          ai_feedback: string | null
          strengths: string[] | null
          improvements: string[] | null
          question_rating: number | null
          response_time_seconds: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          user_id: string
          response_text?: string | null
          response_audio_url?: string | null
          response_duration_seconds?: number | null
          ai_score?: number | null
          ai_feedback?: string | null
          strengths?: string[] | null
          improvements?: string[] | null
          question_rating?: number | null
          response_time_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          user_id?: string
          response_text?: string | null
          response_audio_url?: string | null
          response_duration_seconds?: number | null
          ai_score?: number | null
          ai_feedback?: string | null
          strengths?: string[] | null
          improvements?: string[] | null
          question_rating?: number | null
          response_time_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          metric_name: string
          metric_value: number | null
          metric_data: any | null
          date_recorded: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metric_name: string
          metric_value?: number | null
          metric_data?: any | null
          date_recorded?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metric_name?: string
          metric_value?: number | null
          metric_data?: any | null
          date_recorded?: string
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_name: string | null
          description: string | null
          icon_name: string | null
          earned_at: string
          metadata: any
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_name?: string | null
          description?: string | null
          icon_name?: string | null
          earned_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_name?: string | null
          description?: string | null
          icon_name?: string | null
          earned_at?: string
          metadata?: any
        }
      }
    }
    Views: {
      user_dashboard_summary: {
        Row: {
          user_id: string | null
          full_name: string | null
          target_role: string | null
          experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
          subscription_status: 'trial' | 'active' | 'canceled' | 'expired' | 'past_due' | null
          plan_name: string | null
          total_sessions: number | null
          avg_score: number | null
          total_responses: number | null
          last_session_date: string | null
        }
      }
      popular_questions: {
        Row: {
          id: string | null
          title: string | null
          question_type: 'behavioral' | 'technical' | 'situational' | 'case_study' | null
          role: string | null
          difficulty: 'easy' | 'medium' | 'hard' | null
          usage_count: number | null
          rating: number | null
          category_name: string | null
          response_count: number | null
          avg_user_score: number | null
        }
      }
    }
    Functions: {
      get_user_subscription_status: {
        Args: { user_uuid: string }
        Returns: {
          is_subscribed: boolean
          plan_name: string
          status: string
          trial_ends_at: string | null
          period_ends_at: string | null
        }[]
      }
      increment_question_usage: {
        Args: { question_uuid: string }
        Returns: void
      }
    }
  }
}

/**
 * Helper function to get user from session
 */
export async function getUser() {
  try {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Helper function to get user session
 */
export async function getSession() {
  try {
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Helper function to sign out user
 */
export async function signOut() {
  try {
    if (!supabase) return { success: false, error: 'Supabase not initialized' }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return { success: false, error }
  }
}

/**
 * Helper function for Google OAuth sign in
 */
export async function signInWithGoogle(redirectTo?: string) {
  try {
    if (!supabase) return { data: null, error: { message: 'Supabase not initialized' } }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'openid profile email'
      }
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    return { success: false, error }
  }
}

/**
 * Helper function for email/password sign up with trial setup
 */
export async function signUpWithEmail(email: string, password: string, fullName: string, profileData?: any) {
  try {
    if (!supabase) return { success: false, error: { message: 'Supabase not initialized' } }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          email_confirm: true,
          ...profileData
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error signing up:', error)
    return { success: false, error }
  }
}

/**
 * Helper function for email/password sign in
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    if (!supabase) return { success: false, error: { message: 'Supabase not initialized' } }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error signing in:', error)
    return { success: false, error }
  }
}

/**
 * Helper function to reset password
 */
export async function resetPassword(email: string) {
  try {
    if (!supabase) return { success: false, error: { message: 'Supabase not initialized' } }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error resetting password:', error)
    return { success: false, error }
  }
}

/**
 * Helper function to update password
 */
export async function updatePassword(password: string) {
  try {
    if (!supabase) return { success: false, error: { message: 'Supabase not initialized' } }
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating password:', error)
    return { success: false, error }
  }
}