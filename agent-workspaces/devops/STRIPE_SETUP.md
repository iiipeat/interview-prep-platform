# Stripe Setup Guide for Interview Prep Platform

## Overview

This guide covers setting up Stripe for the Interview Prep Platform's subscription model:
- **Single Plan**: 7-day free trial that converts to $5/week
- **Webhook Events**: Automated handling of subscription lifecycle and payment events
- **Production Ready**: Comprehensive error handling and monitoring

## Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **API Keys**: Obtain publishable and secret keys
3. **Webhook Endpoint**: Configure webhook endpoint URL

## Environment Variables

Add these environment variables to your `.env.local` and production environment:

```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_SECRET_KEY=sk_test_...      # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...    # Webhook endpoint secret

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app's base URL
```

## Stripe Dashboard Setup

### 1. Create Product and Price

1. Navigate to **Products** in Stripe Dashboard
2. Create a new product:
   - **Name**: Interview Prep Access
   - **Description**: Unlimited interview practice with AI feedback

3. Add a recurring price:
   - **Amount**: $5.00
   - **Currency**: USD
   - **Billing Period**: Weekly
   - **Trial Period**: 7 days
   - **Price ID**: Save this for your environment (e.g., `price_1ABC123...`)

### 2. Configure Webhook Endpoint

1. Navigate to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set **Endpoint URL**: `https://your-domain.com/api/subscriptions/webhook`
4. Select the following events:

#### Required Webhook Events

```
customer.subscription.trial_will_end
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
```

#### Optional Events (for enhanced functionality)

```
checkout.session.completed
customer.subscription.trial_ending
invoice.created
invoice.finalized
payment_method.attached
```

5. Save the endpoint and copy the **Signing Secret** to your environment variables

## Implementation Details

### Webhook Event Handling

Our webhook implementation handles the complete subscription lifecycle:

#### Trial Management
- **`trial_will_end`**: Triggered 3 days before trial expires
  - Sends notification to user
  - Updates internal tracking

#### Subscription Lifecycle
- **`subscription.created`**: New subscription started
  - Creates user_subscription record
  - Sets initial status (trial or active)
  
- **`subscription.updated`**: Subscription modified
  - Handles trial-to-paid conversion
  - Updates subscription status and dates
  
- **`subscription.deleted`**: Subscription canceled
  - Marks subscription as canceled
  - Sends cancellation notification

#### Payment Events
- **`payment_succeeded`**: Successful payment
  - Updates subscription to active status
  - Sends payment confirmation
  
- **`payment_failed`**: Failed payment
  - Updates subscription to past_due
  - Sends payment failure notification
  - Tracks retry attempts

### Database Integration

The webhooks automatically update these database tables:

```sql
-- User subscriptions
UPDATE user_subscriptions SET
  status = 'active|trial|past_due|canceled',
  current_period_start = ...,
  current_period_end = ...,
  trial_end_date = ...,
  cancel_at_period_end = ...,
  updated_at = NOW()
WHERE stripe_subscription_id = ?;

-- Prompt usage tracking (daily limits)
INSERT INTO prompt_usage (user_id, usage_date, prompt_count, prompt_limit)
VALUES (?, CURRENT_DATE, 0, 20);
```

## Testing

### 1. Test Webhook Endpoint

Use Stripe CLI to test webhook delivery:

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to your Stripe account
stripe login

# Test webhook endpoint
stripe listen --forward-to localhost:3000/api/subscriptions/webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.trial_will_end
```

### 2. Test Subscription Flow

1. **Create Test Subscription**:
   ```bash
   curl -X POST http://localhost:3000/api/payments/checkout \
     -H "Content-Type: application/json" \
     -d '{"userId":"test-user-id","email":"test@example.com"}'
   ```

2. **Complete Checkout**: Use Stripe's test card numbers
   - **Success**: 4242424242424242
   - **Declined**: 4000000000000002
   - **Requires Authentication**: 4000002500003155

3. **Verify Database**: Check `user_subscriptions` table for correct status

### 3. Test Webhook Events

Trigger webhook events manually for testing:

```bash
# Trial will end (3 days notice)
stripe trigger customer.subscription.trial_will_end

# Payment failure
stripe trigger invoice.payment_failed

# Subscription cancellation
stripe trigger customer.subscription.deleted
```

## Monitoring and Logging

### Webhook Monitoring

Monitor webhook delivery in:
1. **Stripe Dashboard**: Developers > Webhooks > [Your Endpoint]
2. **Application Logs**: Check console/log files for webhook processing
3. **Database**: Verify subscription status updates

### Key Metrics to Monitor

```javascript
// Example monitoring queries
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time
FROM user_subscriptions 
GROUP BY status;

-- Failed webhook processing
SELECT * FROM application_logs 
WHERE level = 'ERROR' 
AND message LIKE '%webhook%' 
ORDER BY created_at DESC;
```

## Production Deployment

### 1. Security Checklist

- [ ] Enable webhook signature verification
- [ ] Use HTTPS for webhook endpoint
- [ ] Set proper CORS headers
- [ ] Validate all webhook payloads
- [ ] Implement idempotency for webhook processing
- [ ] Set up proper error handling and retries

### 2. Performance Optimization

- [ ] Add database indexes on `stripe_subscription_id`
- [ ] Implement webhook event deduplication
- [ ] Set up async processing for heavy operations
- [ ] Monitor webhook response times (<5 seconds)

### 3. Error Handling

```typescript
// Example error handling strategy
try {
  await processWebhookEvent(event);
} catch (error) {
  if (isRetryableError(error)) {
    // Return 5xx to trigger Stripe retry
    return new Response('Internal Server Error', { status: 500 });
  } else {
    // Return 200 to prevent retry for non-retryable errors
    return new Response('OK', { status: 200 });
  }
}
```

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Fails**
   - Check `STRIPE_WEBHOOK_SECRET` environment variable
   - Ensure webhook secret matches Stripe dashboard
   - Verify request body parsing (use raw body)

2. **User Not Found Errors**
   - Check email matching between Stripe customer and database
   - Implement customer creation fallback
   - Add proper error logging

3. **Database Update Failures**
   - Check foreign key constraints
   - Verify subscription plan exists
   - Add proper transaction handling

4. **Notification Failures**
   - Check email service configuration
   - Implement retry logic for notifications
   - Add fallback notification methods

### Debug Commands

```bash
# Check webhook endpoint status
curl -I https://your-domain.com/api/subscriptions/webhook

# Test webhook processing locally
stripe listen --forward-to localhost:3000/api/subscriptions/webhook

# View recent webhook attempts
stripe webhooks endpoints retrieve we_... --expand data
```

## Support and Resources

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Webhook Testing**: [stripe.com/docs/webhooks/test](https://stripe.com/docs/webhooks/test)
- **API Reference**: [stripe.com/docs/api](https://stripe.com/docs/api)
- **Status Page**: [status.stripe.com](https://status.stripe.com)

---

## Quick Setup Summary

1. **Environment Variables**: Set Stripe keys and webhook secret
2. **Product Setup**: Create $5/week product with 7-day trial
3. **Webhook Configuration**: Add endpoint with required events
4. **Testing**: Use Stripe CLI to test webhook delivery
5. **Monitoring**: Set up logging and error tracking
6. **Production**: Enable signature verification and security measures

For additional support, check the troubleshooting section or contact the development team.