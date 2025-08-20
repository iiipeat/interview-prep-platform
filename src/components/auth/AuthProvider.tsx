'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  career_goals?: string;
  target_role?: string;
  experience_level?: string;
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>
  signUp: (email: string, password: string, fullName: string, profileData?: any) => Promise<{ success: boolean; error?: any }>
  signOut: () => Promise<{ success: boolean; error?: any }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Custom hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider component that manages authentication state
 * Provides secure session management and user profile data
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  })

  /**
   * Fetch user profile data from our database
   */
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!supabase) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          user_profiles (
            current_job_role,
            target_role,
            experience_level,
            industry,
            career_goals
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      // Format the profile data
      return {
        id: data.id,
        email: data.email,
        name: data.full_name,
        career_goals: data.user_profiles?.[0]?.career_goals,
        target_role: data.user_profiles?.[0]?.target_role,
        experience_level: data.user_profiles?.[0]?.experience_level,
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  /**
   * Update auth state when session changes
   */
  const updateAuthState = async (session: Session | null) => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id)
      
      setAuthState({
        user: session.user,
        profile,
        session,
        loading: false,
        isAuthenticated: true,
      })
    } else {
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        isAuthenticated: false,
      })
    }
  }

  /**
   * Initialize auth state and listen for changes
   */
  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Timeout to ensure loading state doesn't stay true indefinitely
    const setLoadingTimeout = () => {
      timeoutId = setTimeout(() => {
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }))
        }
      }, 5000)
    }

    // Get initial session from Supabase only
    const initializeAuth = async () => {
      setLoadingTimeout()
      
      try {
        if (!supabase) {
          if (mounted) {
            clearTimeout(timeoutId)
            setAuthState(prev => ({ ...prev, loading: false }))
          }
          return
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }

        if (mounted) {
          clearTimeout(timeoutId)
          await updateAuthState(session)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          clearTimeout(timeoutId)
          setAuthState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes and handle token refresh
    let subscription: any = null;
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
        if (!mounted) return
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            await updateAuthState(session)
            // Set up automatic token refresh
            if (session && refreshInterval) {
              clearInterval(refreshInterval)
            }
            if (session) {
              // Refresh token 5 minutes before expiry
              const refreshTime = (session.expires_in - 300) * 1000
              refreshInterval = setInterval(async () => {
                if (mounted && supabase) {
                  await supabase.auth.refreshSession()
                }
              }, refreshTime)
            }
            break
          case 'TOKEN_REFRESHED':
            await updateAuthState(session)
            break
          case 'SIGNED_OUT':
            if (refreshInterval) {
              clearInterval(refreshInterval)
              refreshInterval = null
            }
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              isAuthenticated: false,
            })
            break
          default:
            await updateAuthState(session)
        }
      }
      )
      subscription = data.subscription
    }

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      subscription?.unsubscribe()
    }
  }, [])

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase) return { success: false, error: 'No supabase client' };
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error }
      }

      if (data.session && data.user) {
        await updateAuthState(data.session)
        return { success: true, data }
      } else {
        return { success: false, error: { message: 'No session created' } }
      }
    } catch (error) {
      console.error('AuthProvider: Sign in error:', error)
      return { success: false, error }
    }
  }

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, fullName: string, profileData?: any) => {
    try {
      if (!supabase) return { success: false, error: 'No supabase client' };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...profileData
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error }
    }
  }


  /**
   * Sign out user
   */
  const signOut = async () => {
    try {
      // Clear auth state immediately
      setAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        isAuthenticated: false,
      })
      
      if (!supabase) return { success: true }
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase signOut error:', error)
        return { success: false, error }
      }

      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error }
    }
  }

  /**
   * Reset password
   */
  const resetPassword = async (email: string) => {
    try {
      if (!supabase) return { success: false, error: 'No supabase client' };
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Reset password error:', error)
      return { success: false, error }
    }
  }

  /**
   * Refresh user profile data
   */
  const refreshProfile = async () => {
    if (authState.user) {
      const profile = await fetchUserProfile(authState.user.id)
      setAuthState(prev => ({ ...prev, profile }))
    }
  }

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
