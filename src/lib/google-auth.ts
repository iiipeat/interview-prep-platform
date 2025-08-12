// Google OAuth implementation using Google Identity Services
// This provides direct Google authentication

interface GoogleUser {
  id: string
  email: string
  name: string
  picture?: string
  verified_email?: boolean
}

interface GoogleAuthResponse {
  credential: string
  select_by?: string
  clientId?: string
}

interface DecodedToken {
  iss: string
  azp: string
  aud: string
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name?: string
  family_name?: string
  iat: number
  exp: number
  jti?: string
}

class GoogleAuthService {
  private clientId: string
  private initialized: boolean = false
  private initPromise: Promise<void> | null = null

  constructor() {
    // Use environment variable
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  }

  /**
   * Initialize Google Identity Services
   */
  async initialize(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return
    
    // Return existing promise if already initializing
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existingScript) {
        this.initialized = true
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        this.initialized = true
        resolve()
      }
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'))
      }
      document.head.appendChild(script)
    })

    return this.initPromise
  }

  /**
   * Decode JWT token from Google (without verification for client-side)
   */
  decodeJWT(token: string): DecodedToken | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      const payload = parts[1]
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Error decoding JWT:', error)
      return null
    }
  }

  /**
   * Handle Google One Tap sign-in
   */
  async signInWithOneTap(callback: (user: GoogleUser) => void): Promise<void> {
    await this.initialize()

    if (typeof window === 'undefined' || !(window as any).google) {
      throw new Error('Google Identity Services not loaded')
    }

    const google = (window as any).google

    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: GoogleAuthResponse) => {
        const decodedToken = this.decodeJWT(response.credential)
        if (decodedToken) {
          const user: GoogleUser = {
            id: decodedToken.sub,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            verified_email: decodedToken.email_verified
          }
          callback(user)
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    google.accounts.id.prompt()
  }

  /**
   * Render Google Sign-In button
   */
  async renderButton(
    elementId: string,
    callback: (user: GoogleUser) => void,
    options?: {
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      width?: number
    }
  ): Promise<void> {
    await this.initialize()

    if (typeof window === 'undefined' || !(window as any).google) {
      throw new Error('Google Identity Services not loaded')
    }

    const google = (window as any).google

    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: GoogleAuthResponse) => {
        const decodedToken = this.decodeJWT(response.credential)
        if (decodedToken) {
          const user: GoogleUser = {
            id: decodedToken.sub,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            verified_email: decodedToken.email_verified
          }
          callback(user)
        }
      }
    })

    const buttonElement = document.getElementById(elementId)
    if (buttonElement) {
      google.accounts.id.renderButton(buttonElement, {
        theme: options?.theme || 'outline',
        size: options?.size || 'large',
        text: options?.text || 'continue_with',
        shape: options?.shape || 'rectangular',
        width: options?.width,
      })
    }
  }

  /**
   * Sign out from Google
   */
  signOut(): void {
    if (typeof window !== 'undefined' && (window as any).google) {
      const google = (window as any).google
      google.accounts.id.disableAutoSelect()
    }
  }

  /**
   * OAuth 2.0 Authorization Code Flow (for server-side verification)
   */
  async initiateOAuthFlow(redirectUri: string): Promise<void> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    })

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService()

// Export types
export type { GoogleUser, GoogleAuthResponse, DecodedToken }