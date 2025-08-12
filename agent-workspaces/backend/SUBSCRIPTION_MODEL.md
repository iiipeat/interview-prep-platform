# Subscription Model Documentation

## Overview

The Interview Prep Platform uses a simplified subscription model with a single plan that includes a 7-day free trial followed by a weekly subscription.

## Subscription Plan

### Interview Prep Access
- **Trial Period**: 7 days free
- **Price**: $5.00/week (500 cents) after trial
- **Daily Prompt Limit**: 20 prompts per day (both trial and paid)
- **Features**:
  - AI-powered interview feedback
  - Access to all industries and roles
  - Progress tracking and analytics
  - Achievement system
  - Unlimited practice sessions
  - Advanced analytics and insights
  - Voice response capabilities

## Database Schema

### Core Tables

#### `subscription_plans`
- Single plan: "Interview Prep Access"
- `price_weekly`: 500 cents ($5.00)
- `features`: JSON object containing all available features
- `max_sessions_per_day`: 999 (unlimited)
- `max_questions_per_session`: 20

#### `user_subscriptions`
- Links users to the subscription plan
- Tracks trial and billing periods
- Integrates with Stripe for payment processing
- Status values: `trial`, `active`, `canceled`, `expired`, `past_due`

#### `prompt_usage` (New)
- Tracks daily prompt usage per user
- `prompt_count`: Current usage for the day
- `prompt_limit`: Daily limit (default: 20)
- `usage_date`: Date of usage tracking
- Automatically resets daily

### Helper Functions

#### `get_daily_prompt_usage(user_uuid, check_date)`
Returns current usage statistics:
- `current_usage`: Number of prompts used today
- `daily_limit`: Maximum prompts allowed per day
- `remaining_prompts`: Prompts remaining for today
- `can_make_prompt`: Boolean indicating if user can make another prompt

#### `increment_prompt_usage(user_uuid, usage_date)`
Increments the prompt count for a user on a specific date:
- Returns `TRUE` if increment successful
- Returns `FALSE` if daily limit exceeded
- Automatically creates usage record if none exists

### Views

#### `user_subscription_status`
Comprehensive view combining subscription and usage data:
- User information
- Subscription details
- Trial status
- Active access status
- Daily prompt usage and limits

## Usage Flow

### New User Registration
1. User signs up and gets access to the single plan
2. Trial period starts (7 days)
3. Daily prompt usage tracking begins (20 prompts/day)
4. User can access all features during trial

### Trial to Paid Conversion
1. Trial expires after 7 days
2. User is prompted to add payment method
3. Stripe subscription created at $5/week
4. Access continues with same feature set
5. Daily prompt limit remains at 20

### Daily Usage Management
1. Each AI prompt request checks current usage
2. `increment_prompt_usage()` called on successful request
3. Returns error if daily limit (20) exceeded
4. Usage resets automatically at midnight

### Subscription Management
1. Users can view usage in dashboard
2. Billing managed through Stripe Customer Portal
3. Subscription can be canceled (access until period end)
4. Failed payments result in `past_due` status

## API Integration Points

### Check Usage Before AI Request
```sql
SELECT * FROM public.get_daily_prompt_usage(user_id);
```

### Record Prompt Usage
```sql
SELECT public.increment_prompt_usage(user_id);
```

### Get User Subscription Status
```sql
SELECT * FROM public.user_subscription_status WHERE user_id = $1;
```

## Business Rules

1. **Trial Period**: 7 days from registration
2. **Daily Limit**: 20 prompts per day (trial and paid)
3. **Billing**: Weekly at $5.00 via Stripe
4. **Grace Period**: Users retain access until current period ends after cancellation
5. **Feature Access**: All features available during both trial and paid periods
6. **Usage Reset**: Daily prompt counter resets at midnight UTC

## Migration Notes

- Migration 008 removes the old 3-plan system
- All existing users will be migrated to the new single plan
- Prompt usage tracking starts fresh for all users
- Existing Stripe subscriptions may need manual migration

## Monitoring and Analytics

### Key Metrics to Track
- Daily prompt usage per user
- Trial conversion rates
- Average prompts used per day
- Subscription churn rate
- Revenue per user per week

### Usage Patterns
- Track prompt usage patterns to optimize limits
- Monitor peak usage times
- Identify power users vs. casual users
- Analyze correlation between usage and retention