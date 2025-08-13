# Render Environment Variables (ARCHIVED)

**NOTE: This project has been migrated to Vercel. See VERCEL_DEPLOYMENT.md for current deployment instructions.**

To deploy this app on Render, you need to set the following environment variables in your Render dashboard:

## Required Environment Variables

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Google OAuth
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1025442262611-t3t9rdjrg50vjk978115g0b459muim12.apps.googleusercontent.com
```

### Stripe Configuration (TEST MODE)
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_WEEKLY_PRICE_ID=price_your_weekly_price_id_here
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id_here
```

### Claude AI
```
CLAUDE_API_KEY=sk-ant-placeholder
```

### Application Settings
```
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
NODE_ENV=production
```

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your service
3. Go to the "Environment" tab
4. Add each environment variable one by one
5. Make sure to update `NEXT_PUBLIC_APP_URL` with your actual Render URL

## Notes

- All `NEXT_PUBLIC_*` variables are safe to be public as they're exposed to the browser
- Replace placeholder values with actual keys from your `.env.local` file
- The actual keys are in your local `.env.local` file - copy them from there to Render
- The Stripe keys should be test keys for development (starting with `sk_test_` and `pk_test_`)
- The build should now complete successfully with these environment variables set

## Getting Your Actual Values

Check your local `.env.local` file for the actual values to use in Render. The placeholders above show the format, but you need to copy the real keys from your local environment.