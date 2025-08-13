import { NextResponse } from 'next/server'

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: PaginationInfo
}

/**
 * Pagination information for list responses
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * Standard success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  pagination?: PaginationInfo,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      pagination
    },
    { status }
  )
}

/**
 * Standard error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details })
    },
    { status }
  )
}

/**
 * Not found response
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404)
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Authentication required'): NextResponse<ApiResponse> {
  return errorResponse(message, 401)
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse<ApiResponse> {
  return errorResponse(message, 403)
}

/**
 * Validation error response
 */
export function validationErrorResponse(errors: Record<string, string[]>): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors
    },
    { status: 422 }
  )
}

/**
 * Internal server error response
 */
export function internalErrorResponse(message: string = 'Internal server error'): NextResponse<ApiResponse> {
  return errorResponse(message, 500)
}

/**
 * Rate limit exceeded response
 */
export function rateLimitResponse(message: string = 'Rate limit exceeded'): NextResponse<ApiResponse> {
  return errorResponse(message, 429)
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Calculate pagination info
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1
  }
}

/**
 * Parse sorting parameters from URL search params
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields: string[] = [],
  defaultSort: string = 'created_at'
) {
  const sortBy = searchParams.get('sort_by') || defaultSort
  const sortOrder = searchParams.get('sort_order')?.toLowerCase() === 'asc' ? 'asc' : 'desc'
  
  // Validate sort field if allowedFields is provided
  const validSortBy = allowedFields.length > 0 
    ? (allowedFields.includes(sortBy) ? sortBy : defaultSort)
    : sortBy

  return { sortBy: validSortBy, sortOrder }
}

/**
 * Parse filter parameters from URL search params
 */
export function parseFilterParams(
  searchParams: URLSearchParams,
  allowedFilters: string[] = []
): Record<string, string> {
  const filters: Record<string, string> = {}
  
  for (const [key, value] of Array.from(searchParams.entries())) {
    // Skip pagination and sorting params
    if (['page', 'limit', 'sort_by', 'sort_order'].includes(key)) {
      continue
    }
    
    // Only include allowed filters if specified
    if (allowedFilters.length === 0 || allowedFilters.includes(key)) {
      filters[key] = value
    }
  }
  
  return filters
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): string[] {
  const errors: string[] = []
  
  for (const field of requiredFields) {
    if (!body || body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`${field} is required`)
    }
  }
  
  return errors
}

/**
 * Sanitize and validate UUID
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Extract user ID from Supabase auth header or session
 */
export function extractUserId(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  
  // This is a simplified version - in practice, you'd verify the JWT token
  // The actual implementation would use Supabase's auth middleware
  try {
    const token = authHeader.replace('Bearer ', '')
    // TODO: Implement JWT verification with Supabase
    // For now, this is a placeholder that would be implemented with proper auth middleware
    return null
  } catch (error) {
    return null
  }
}

/**
 * Create a standardized API error from unknown error
 */
export function createApiError(error: unknown): { message: string; status: number } {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('duplicate key')) {
      return { message: 'Resource already exists', status: 409 }
    }
    if (error.message.includes('foreign key')) {
      return { message: 'Invalid reference to related resource', status: 400 }
    }
    if (error.message.includes('not found')) {
      return { message: 'Resource not found', status: 404 }
    }
    
    return { message: error.message, status: 500 }
  }
  
  return { message: 'Unknown error occurred', status: 500 }
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(jsonString: string): { data: T | null; error: string | null } {
  try {
    const data = JSON.parse(jsonString) as T
    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Invalid JSON' 
    }
  }
}

/**
 * Convert camelCase object keys to snake_case for database operations
 */
export function camelToSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  
  return result
}

/**
 * Convert snake_case object keys to camelCase for API responses
 */
export function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  
  return result
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * In production, use Redis or a proper rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `rate_limit:${identifier}`
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }
  
  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  // Increment counter
  current.count++
  rateLimitStore.set(key, current)
  
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetTime: current.resetTime 
  }
}