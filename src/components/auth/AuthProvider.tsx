'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, supabase } from '@/lib/mock-supabase'

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
  signInWithGoogle: (redirectTo?: string) => Promise<{ success: boolean; error?: any }>
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
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_profiles (*)
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
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

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }

        if (mounted) {
          await updateAuthState(session)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.id)
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            await updateAuthState(session)
            break
          case 'SIGNED_OUT':
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              isAuthenticated: false,
            })
            break
          case 'PASSWORD_RECOVERY':
            // Handle password recovery if needed
            break
          default:
            await updateAuthState(session)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error }
    }
  }

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, fullName: string, profileData?: any) => {
    try {
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
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async (redirectTo?: string) => {
    try {
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

      if (error) {
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { success: false, error }
    }
  }

  /**
   * Sign out user
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
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
    signInWithGoogle,
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