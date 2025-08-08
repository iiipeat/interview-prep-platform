# Interview Prep Platform - Backend API Documentation

## Overview
This document outlines the RESTful API endpoints for the Interview Prep Platform. All endpoints follow REST conventions and return JSON responses with a standardized format.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
Most endpoints require authentication using Bearer tokens obtained from the authentication endpoints.

```
Authorization: Bearer <access_token>
```

## Response Format
All API responses follow this standard format:

```json
{
  "success": boolean,
  "data": any | null,
  "message": string | undefined,
  "error": string | undefined,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrevious": boolean
  } | undefined
}
```

## Error Handling
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing or invalid authentication)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (resource already exists)
- **422** - Validation Error
- **429** - Rate Limited
- **500** - Internal Server Error

---

## Authentication Endpoints

### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "emailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "User registered successfully"
}
```

### POST /api/auth/signin
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "profile": { ... }
    },
    "session": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresAt": 1234567890,
      "tokenType": "Bearer"
    }
  }
}
```

### POST /api/auth/signout
Sign out the current user.

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

### GET /api/auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "profile": { ... },
      "subscription": { ... }
    }
  }
}
```

### POST /api/auth/refresh
Refresh authentication session.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

---

## User Profile Endpoints

### GET /api/users/profile
Get current user's profile information.

**Headers:** `Authorization: Bearer <token>`

### POST /api/users/profile
Create user profile (onboarding).

**Request Body:**
```json
{
  "currentRole": "Software Engineer",
  "targetRole": "Senior Software Engineer",
  "experienceLevel": "mid",
  "industry": "Technology",
  "preferredDifficulty": "medium",
  "skills": ["JavaScript", "React", "Node.js"]
}
```

### PUT /api/users/profile
Update user profile.

**Request Body:** (all fields optional)
```json
{
  "currentRole": "Senior Software Engineer",
  "careerGoals": "Become a tech lead",
  "skills": ["JavaScript", "React", "Node.js", "Python"]
}
```

### GET /api/users/dashboard
Get user dashboard data including stats and recent activity.

---

## Subscription Management

### GET /api/subscriptions/plans
Get all available subscription plans.

### GET /api/subscriptions/status
Get current user's subscription status.

**Headers:** `Authorization: Bearer <token>`

### POST /api/subscriptions/trial
Start free trial for user.

**Headers:** `Authorization: Bearer <token>`

### POST /api/subscriptions/webhook
Handle Stripe webhook events (for Stripe integration).

---

## Question Management

### GET /api/questions
Get questions with filtering, sorting, and pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `category_id` (UUID)
- `question_type` (behavioral|technical|situational|case_study)
- `role` (string)
- `experience_level` (entry|junior|mid|senior|lead|executive)
- `difficulty` (easy|medium|hard)
- `search` (string)
- `sort_by` (title|difficulty|usage_count|rating|created_at)
- `sort_order` (asc|desc)

### POST /api/questions/generate
Generate new questions using AI.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "Software Engineer",
  "experienceLevel": "mid",
  "questionType": "behavioral",
  "difficulty": "medium",
  "count": 5,
  "industry": "Technology",
  "skills": ["JavaScript", "React"]
}
```

### GET /api/questions/categories
Get all question categories.

### GET /api/questions/[id]
Get a specific question by ID.

---

## Practice Session Management

### GET /api/sessions
Get user's practice sessions.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`, `limit` (pagination)
- `status` (in_progress|completed|abandoned)

### POST /api/sessions
Create a new practice session.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "sessionType": "quick",
  "targetRole": "Software Engineer",
  "difficulty": "medium",
  "durationMinutes": 30,
  "questionCount": 5
}
```

### GET /api/sessions/[id]
Get a specific practice session with responses.

**Headers:** `Authorization: Bearer <token>`

### PUT /api/sessions/[id]
Update session (complete, abandon, etc.).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "completed",
  "overallScore": 85.5,
  "feedbackSummary": "Great progress on behavioral questions..."
}
```

### DELETE /api/sessions/[id]
Delete a practice session.

**Headers:** `Authorization: Bearer <token>`

### POST /api/sessions/[id]/responses
Submit a response to a question in the session.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "questionId": "uuid",
  "responseText": "My answer to the question...",
  "responseTimeSeconds": 120,
  "questionRating": 4
}
```

---

## Progress Tracking

### GET /api/progress
Get user's progress metrics.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`, `limit` (pagination)
- `metric_name` (string)
- `start_date`, `end_date` (YYYY-MM-DD)
- `days` (number - get last N days)

### GET /api/progress/achievements
Get user's achievements.

**Headers:** `Authorization: Bearer <token>`

### POST /api/progress/achievements
Award achievement to user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "achievementType": "first_session",
  "achievementName": "First Steps",
  "description": "Completed your first practice session",
  "iconName": "trophy"
}
```

### GET /api/progress/stats
Get comprehensive user statistics.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (default: 30) - number of days

**Response:**
```json
{
  "success": true,
  "data": {
    "period": 30,
    "sessions": {
      "total": 15,
      "completed": 12,
      "completionRate": 80,
      "averageScore": 78.5
    },
    "responses": {
      "total": 60,
      "averageScore": 82.1,
      "averageResponseTime": 145
    },
    "streaks": {
      "current": 5,
      "longest": 8
    },
    "improvement": {
      "trend": 5.2,
      "isImproving": true
    },
    "performanceByQuestionType": {
      "behavioral": {
        "avgScore": 85.2,
        "count": 25
      }
    }
  }
}
```

---

## Rate Limits
- Authentication endpoints: 10 requests per minute
- Question generation: 5 requests per hour (varies by subscription)
- All other endpoints: 100 requests per 15 minutes

## Webhooks
The API supports webhooks for real-time updates:

### Stripe Webhooks
- `POST /api/subscriptions/webhook` - Handles subscription events from Stripe

## Error Codes
- `AUTHENTICATION_ERROR` - Invalid or missing authentication
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMIT_ERROR` - Rate limit exceeded
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External service (AI, Stripe) error

## Data Formats
- Dates: ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- UUIDs: Standard UUID v4 format
- Scores: Decimal numbers (0-100)
- Currency: Integer cents (e.g., 2900 = $29.00)

## Integration Notes

### AI Integration (for Alex)
- Question generation endpoint: `/api/questions/generate`
- Response feedback: Handled in `/api/sessions/[id]/responses`
- Mock implementations are currently in place

### Frontend Integration (for Sarah)
- All endpoints return standardized JSON responses
- Error handling is consistent across all endpoints
- Pagination follows standard patterns

### Payment Integration (for Sam)
- Subscription status checking
- Webhook handling for Stripe events
- Trial management

## Environment Variables Required
See `.env.local.example` for the complete list of required environment variables.

## Testing
- All endpoints include comprehensive error handling
- Input validation using Zod schemas
- Mock implementations for AI features
- Database transactions where appropriate

## Security Features
- JWT-based authentication
- Row Level Security (RLS) in database
- Input validation and sanitization
- Rate limiting
- CORS configuration
- SQL injection protection via Supabase client