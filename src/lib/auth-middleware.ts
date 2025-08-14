import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './supabase'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/practice',
  '/progress',
  '/settings',
  '/profile',
  '/mock-interviews',
  '/achievements',
  '/history',
  '/resources',
  '/practice-buddy',
  '/api/sessions',
  '/api/progress',
  '/api/subscriptions',
  '/api/users',
  '/api/questions/generate',
]

// Routes that should redirect authenticated users away
const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
]

// Public routes (no authentication required)
const PUBLIC_ROUTES = [
  '/',
  '/welcome',
  '/login',
  '/signup',
  '/pricing',
  '/auth/forgot-password',
]

// Public API routes (no authentication required)
const PUBLIC_API_ROUTES = [
  '/api/auth/',
  '/api/questions/categories',
  '/api/subscriptions/plans',
]

/**
 * Rate limiting store (in-memory for demo - use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiting function
 * @param identifier - IP address or user ID
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
function isRateLimited(identifier: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now()
  const key = `rate_limit:${identifier}`
  
  const existing = rateLimitStore.get(key)
  
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (existing.count >= maxRequests) {
    return true
  }
  
  existing.count++
  rateLimitStore.set(key, existing)
  return false
}

/**
 * Check if route is public (no auth required)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  // If it's a public route, it's not protected
  if (isPublicRoute(pathname)) {
    return false
  }
  // Check if it's in the protected routes list
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if route is auth-only (should redirect authenticated users)
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if API route is public
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Get client IP address for rate limiting
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || 'unknown'
}

/**
 * Authentication middleware for Next.js
 * Handles session validation, rate limiting, and route protection
 */
export async function authMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api')
  
  // Rate limiting for all requests
  const clientIP = getClientIP(request)
  const rateLimitKey = session?.user?.id || clientIP
  
  // Different rate limits for different route types
  let maxRequests = 100 // Default rate limit
  let windowMs = 60000 // 1 minute
  
  if (pathname.startsWith('/api/auth/')) {
    maxRequests = 10 // Stricter rate limit for auth endpoints
    windowMs = 60000 // 1 minute
  } else if (pathname.startsWith('/api/')) {
    maxRequests = 60 // API endpoints
    windowMs = 60000 // 1 minute
  }
  
  if (isRateLimited(rateLimitKey, maxRequests, windowMs)) {
    if (isApiRoute) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests', 
          message: 'Rate limit exceeded. Please try again later.' 
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    } else {
      return NextResponse.redirect(new URL('/rate-limited', request.url))
    }
  }

  // Handle API routes
  if (isApiRoute) {
    // Public API routes don't require authentication
    if (isPublicApiRoute(pathname)) {
      return response
    }
    
    // Protected API routes require authentication
    if (isProtectedRoute(pathname) && !session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        },
        { status: 401 }
      )
    }
    
    return response
  }

  // Handle page routes
  
  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname) && session) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }
  
  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute(pathname) && !session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }
  
  // For authenticated users, add security headers
  if (session) {
    response.headers.set('X-User-ID', session.user.id)
    response.headers.set('X-Authenticated', 'true')
  }
  
  // Add security headers for all responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add CSP header for additional security
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://accounts.google.com",
    "frame-src 'self' https://js.stripe.com https://accounts.google.com",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  return response
}

/**
 * Get authenticated user from request (for API routes)
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Require authentication for API route
 */
export function requireAuth() {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        },
        { status: 401 }
      )
    }
    
    return user
  }
}

/**
 * CSRF token validation (simple implementation)
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF validation for GET requests and auth endpoints
  if (request.method === 'GET' || request.nextUrl.pathname.startsWith('/api/auth/')) {
    return true
  }
  
  const csrfToken = request.headers.get('x-csrf-token')
  const sessionToken = request.headers.get('authorization')
  
  if (!csrfToken || !sessionToken) {
    return false
  }
  
  // Simple CSRF validation - in production, use a more robust implementation
  // This should be a cryptographically secure comparison
  return csrfToken.length > 10 && sessionToken.length > 10
}

/**
 * Higher-order function for API routes that require authentication
 * @param handler - The API route handler function
 * @returns Wrapped handler that includes authentication check
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, context: { user: any }) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    try {
      const response = NextResponse.next()
      const supabase = createMiddlewareClient<Database>({ req: request, res: response })
      
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required',
          },
          { status: 401 }
        ) as NextResponse<T>
      }
      
      // Call the original handler with the authenticated user
      return handler(request, { user })
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          message: 'Unable to verify authentication',
        },
        { status: 401 }
      ) as NextResponse<T>
    }
  }
}

/**
 * Security middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}