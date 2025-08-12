# Prompt Limiting Implementation

## Overview
Implemented prompt counting and limiting functionality in the question generation service. Users now have a 20 prompts/day limit (for both trial and paid users).

## Key Changes

### 1. QuestionService Updates (`src/lib/ai/question-service.ts`)

**Added new interfaces:**
- `PromptUsageInfo`: Tracks daily usage, limits, and remaining prompts
- `PromptLimitError`: Custom error class for limit exceeded scenarios

**New methods:**
- `checkPromptUsage(authToken)`: Validates if user can make a prompt without incrementing counter
- `trackPromptUsage(authToken)`: Increments prompt counter after successful generation
- Enhanced `generateQuestions()`: Now checks limits before AI calls and tracks usage after

**Key features:**
- Pre-flight limit checking before expensive AI calls
- Post-generation usage tracking
- Each question generated = 1 prompt consumed
- Graceful error handling with user-friendly messages

### 2. API Route Updates (`src/app/api/questions/generate/route.ts`)

**Enhanced validation:**
- Subscription status verification (trial/active)
- Subscription expiry checking
- Authentication token validation

**Prompt limiting integration:**
- Uses updated QuestionService with auth token
- Returns usage info in responses
- Proper error handling for limit exceeded scenarios
- Rate limit responses (HTTP 429) when limits hit

**Response format:**
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "usage": {
      "remainingPrompts": 15,
      "dailyLimit": 20,
      "todayCount": 5,
      "resetTime": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Validation Schema (`src/lib/validation.ts`)

**Added:**
- `questionGenerationSchema`: Validates question generation requests
- `validateRequestBody()`: Request validation with sensible defaults
- Count limiting (1-5 questions max per request)

## Usage Flow

1. **User makes request** → API validates auth & subscription
2. **Pre-check limits** → QuestionService checks if user has remaining prompts
3. **Generate questions** → If limits OK, proceed with AI generation
4. **Track usage** → Increment counter for each generated question
5. **Return response** → Include questions and updated usage info

## Error Handling

### Limit Exceeded (HTTP 429)
```json
{
  "success": false,
  "error": "Daily prompt limit exceeded. You can generate more questions after 2024-01-01T00:00:00.000Z"
}
```

### Subscription Issues (HTTP 403)
```json
{
  "success": false,
  "error": "Your subscription has expired. Please renew to continue generating questions."
}
```

## API Integration

The existing `/api/prompts/usage` endpoint is used for:
- **GET**: Check current usage without incrementing
- **POST**: Increment usage counter after successful generation
- **PUT**: Pre-flight check if user can make a prompt

## Key Benefits

1. **Cost Control**: Prevents expensive AI calls when limits exceeded
2. **Fair Usage**: Enforces 20/day limit for all users
3. **User Experience**: Clear error messages with reset times
4. **Seamless Integration**: Works with existing subscription system
5. **Robust Error Handling**: Graceful degradation on failures

## Testing Recommendations

1. Test with user at limit (should return 429)
2. Test with expired subscription (should return 403)
3. Test successful generation (should track usage)
4. Test network failures (should handle gracefully)
5. Verify usage info in responses