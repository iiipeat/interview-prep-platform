import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, internalErrorResponse } from './api-helpers'

/**
 * Custom error classes for different types of API errors
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, message: string = 'External service unavailable') {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', { service })
    this.name = 'ExternalServiceError'
  }
}

/**
 * Error handler middleware wrapper for API routes
 */
export function withErrorHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleError(error, req)
    }
  }
}

/**
 * Central error handler for API routes
 */
export function handleError(error: unknown, req?: NextRequest): NextResponse {
  // Log error for debugging (in production, use proper logging service)
  console.error('API Error:', {
    error,
    url: req?.url,
    method: req?.method,
    timestamp: new Date().toISOString(),
    userAgent: req?.headers.get('user-agent'),
  })

  // Handle known error types
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    )
  }

  // Handle Supabase errors
  if (isSupabaseError(error)) {
    return handleSupabaseError(error)
  }

  // Handle Zod validation errors
  if (isZodError(error)) {
    return handleZodError(error)
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    const message = isDevelopment ? error.message : 'Internal server error'
    
    return internalErrorResponse(message)
  }

  // Handle unknown errors
  return internalErrorResponse('An unexpected error occurred')
}

/**
 * Check if error is from Supabase
 */
function isSupabaseError(error: any): boolean {
  return (
    error &&
    typeof error === 'object' &&
    ('code' in error || 'message' in error || 'details' in error)
  )
}

/**
 * Handle Supabase-specific errors
 */
function handleSupabaseError(error: any): NextResponse {
  const { code, message, details, hint } = error

  // Map Supabase error codes to appropriate HTTP status codes
  switch (code) {
    case 'PGRST116': // Row not found
      return errorResponse('Resource not found', 404)
    
    case 'PGRST301': // Query failed
      return errorResponse('Invalid query parameters', 400)
    
    case '23505': // Unique violation
      return errorResponse('Resource already exists', 409)
    
    case '23503': // Foreign key violation
      return errorResponse('Invalid reference to related resource', 400)
    
    case '23502': // Not null violation
      return errorResponse('Required field is missing', 400)
    
    case '42501': // Insufficient privilege
      return errorResponse('Access denied', 403)
    
    case '42P01': // Undefined table
      return internalErrorResponse('Database schema error')
    
    case 'AUTHENTICATION_ERROR':
      return errorResponse('Authentication failed', 401)
    
    case 'AUTHORIZATION_ERROR':
      return errorResponse('Access denied', 403)
    
    default:
      // Log unknown Supabase errors for investigation
      console.warn('Unknown Supabase error:', { code, message, details, hint })
      return internalErrorResponse(
        process.env.NODE_ENV === 'development' ? message : 'Database operation failed'
      )
  }
}

/**
 * Check if error is from Zod validation
 */
function isZodError(error: any): boolean {
  return error && error.name === 'ZodError' && Array.isArray(error.issues)
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: any): NextResponse {
  const validationErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!validationErrors[field]) {
      validationErrors[field] = []
    }
    validationErrors[field].push(issue.message)
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: validationErrors,
    },
    { status: 422 }
  )
}

/**
 * Async error handler for promises
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return fn(...args).catch((error) => {
      throw error
    })
  }
}

/**
 * Safe async execution with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { data: fallback || null, error: errorMessage }
  }
}

/**
 * Retry mechanism for database operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Operation failed')
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (i === maxRetries) {
        break
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw new DatabaseError(`Operation failed after ${maxRetries} retries: ${lastError.message}`)
}

/**
 * Database transaction wrapper with error handling
 */
export async function withTransaction<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    // Note: Supabase doesn't have explicit transaction support in the JS client
    // This is a placeholder for when we might add direct database connections
    return await operation()
  } catch (error) {
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Transaction failed'
    )
  }
}

/**
 * Error boundary for React Server Components
 */
export class ErrorBoundary extends Error {
  constructor(
    public originalError: Error,
    public statusCode: number = 500
  ) {
    super(originalError.message)
    this.name = 'ErrorBoundary'
  }
}

/**
 * Create user-friendly error messages
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (isSupabaseError(error)) {
    const { code } = error as any
    switch (code) {
      case '23505':
        return 'This item already exists'
      case '23503':
        return 'Cannot complete operation due to missing dependencies'
      case '23502':
        return 'Required information is missing'
      case 'PGRST116':
        return 'Item not found'
      default:
        return 'A database error occurred'
    }
  }
  
  if (error instanceof Error) {
    // Map common errors to user-friendly messages
    if (error.message.includes('network')) {
      return 'Network connection error. Please check your internet connection.'
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Log error with context for debugging
 */
export function logError(
  error: unknown,
  context: {
    operation?: string
    userId?: string
    requestId?: string
    metadata?: Record<string, any>
  } = {}
) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    context,
  }

  // In production, send to logging service (Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external logging service
    console.error('Production Error:', JSON.stringify(errorInfo, null, 2))
  } else {
    console.error('Development Error:', errorInfo)
  }
}