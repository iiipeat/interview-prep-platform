# Stripe Integration Setup Guide

## ✅ What's Been Implemented

1. **Stripe SDK Integration**
   - Installed `stripe` and `@stripe/stripe-js` packages
   - Created production-ready Stripe client with all necessary methods

2. **Dual Plan Support**
   - Weekly Plan: $5/week with 20 questions/day
   - Monthly Unlimited Plan: $29/month with unlimited questions
   - Both plans include 7-day free trial

3. **API Routes**
   - `/api/payments/checkout` - Creates Stripe checkout sessions
   - `/api/subscriptions/webhook` - Handles Stripe webhooks with signature verification
   - `/api/payments/billing-portal` - Customer portal for subscription management

4. **Pricing Page**
   - Updated with real Stripe checkout integration
   - Loading states and error handling
   - Automatic redirect to Stripe Checkout

## 🚀 Quick Setup Instructions

### Step 1: Create Your Stripe Account
1. Go to [https://stripe.com](https://stripe.com) and sign up
2. Complete your account setup
3. Navigate to the Dashboard

### Step 2: Get Your API Keys
1. In Stripe Dashboard, go to **Developers → API keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Step 3: Create Products and Prices
1. Go to **Products** in Stripe Dashboard
2. Click **Add product**

#### Weekly Plan:
- **Name**: Interview Prep Weekly
- **Description**: Weekly access with 20 questions per day
- Click **Add price**:
  - **Price**: $5.00
  - **Billing period**: Weekly
  - **Trial period**: 7 days
- Save the price ID (starts with `price_`)

#### Monthly Plan:
- **Name**: Interview Prep Monthly Unlimited
- **Description**: Unlimited access to all features
- Click **Add price**:
  - **Price**: $29.00
  - **Billing period**: Monthly
  - **Trial period**: 7 days
- Save the price ID

### Step 4: Configure Webhook Endpoint
1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL:
   - For local testing: Use Stripe CLI (see below)
   - For production: `https://yourdomain.com/api/subscriptions/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Save the **Signing secret** (starts with `whsec_`)

### Step 5: Update Environment Variables
Edit your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Stripe Price IDs
STRIPE_WEEKLY_PRICE_ID=price_YOUR_WEEKLY_PRICE_ID
STRIPE_MONTHLY_PRICE_ID=price_YOUR_MONTHLY_PRICE_ID
```

## 🧪 Testing Locally

### Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from
# https://stripe.com/docs/stripe-cli
```

### Login to Stripe
```bash
stripe login
```

### Forward Webhooks to Local Server
```bash
# In a separate terminal
stripe listen --forward-to localhost:3000/api/subscriptions/webhook
```

This will display a webhook signing secret - temporarily use this in your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_temporary_local_secret
```

### Test the Integration

1. **Start your development server:**
```bash
npm run dev
```

2. **Test checkout flow:**
   - Navigate to `/pricing`
   - Click "Get Monthly Unlimited"
   - You'll be redirected to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date and any CVC

3. **Monitor webhook events:**
```bash
# In the terminal running stripe listen
# You'll see events being received and processed
```

4. **Test subscription management:**
   - After successful payment, go to `/dashboard`
   - Click on subscription management (when implemented)
   - You'll be redirected to Stripe Customer Portal

## 📝 Test Card Numbers

| Scenario | Card Number | CVC | Expiry |
|----------|------------|-----|---------|
| Success | 4242 4242 4242 4242 | Any 3 digits | Any future date |
| Decline | 4000 0000 0000 0002 | Any 3 digits | Any future date |
| Requires Authentication | 4000 0025 0000 3155 | Any 3 digits | Any future date |

## 🔍 Debugging Tips

### Check Webhook Delivery
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your endpoint
3. View "Webhook attempts" to see delivery status

### View Stripe Logs
```bash
stripe logs tail
```

### Test Specific Events
```bash
# Trigger specific webhook events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### Common Issues and Solutions

**Issue**: "Missing stripe signature" error
**Solution**: Make sure `STRIPE_WEBHOOK_SECRET` is set correctly

**Issue**: Checkout session not creating
**Solution**: Verify `STRIPE_SECRET_KEY` is correct and products exist in Stripe

**Issue**: Webhook signature verification failing
**Solution**: Ensure you're using the raw request body (not parsed JSON)

## 🚢 Production Deployment

1. **Update environment variables** in your production environment
2. **Use production API keys** (start with `pk_live_` and `sk_live_`)
3. **Update webhook endpoint URL** in Stripe Dashboard
4. **Enable webhook signature verification** (already implemented)
5. **Set up proper error monitoring** (e.g., Sentry)
6. **Configure billing portal** settings in Stripe Dashboard

## 📊 Monitoring

### Key Metrics to Track
- Successful checkouts
- Failed payments
- Trial conversions
- Subscription cancellations
- Webhook processing times

### Stripe Dashboard Reports
- Go to **Analytics** in Stripe Dashboard
- Monitor subscription metrics
- Set up alerts for failed payments

## 🔒 Security Checklist

- ✅ Webhook signature verification implemented
- ✅ API routes protected with authentication
- ✅ Environment variables properly configured
- ✅ Error handling without exposing sensitive data
- ✅ HTTPS required for production

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)

## Need Help?

1. Check Stripe Dashboard for detailed error messages
2. Use `stripe logs tail` to see real-time activity
3. Review webhook attempts in the Dashboard
4. Check application logs for detailed error messages

---

**Last Updated**: December 2024
**Status**: Ready for testing with real Stripe API keys