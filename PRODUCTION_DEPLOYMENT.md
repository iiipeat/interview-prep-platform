# Production Deployment Guide

## Overview
This guide walks through deploying the Interview Prep Platform to production. **This project has been migrated to Vercel** for better Next.js integration and performance.

**📋 For current deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)**

## Legacy Render Deployment
The information below is archived for reference. This project previously deployed to Render.com.

## Prerequisites Checklist

- [ ] Supabase project created and configured
- [ ] Stripe account with products created
- [ ] Claude API key obtained
- [ ] Google OAuth credentials configured
- [ ] Google Sheets API service account created
- [ ] Domain name (optional but recommended)

## Phase 1: Service Configuration

### 1.1 Supabase Setup
Follow `SUPABASE_SETUP.md` to:
- Create project and database
- Run migration scripts
- Configure authentication
- Set up Row Level Security

### 1.2 Stripe Configuration
Follow `STRIPE_SETUP_GUIDE.md` to:
- Create products (Weekly $5, Monthly $29)
- Set up webhook endpoint
- Configure test mode first
- Get all necessary API keys

### 1.3 Claude AI Setup
1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Set usage limits if needed

### 1.4 Google Services
Follow `GOOGLE_SHEETS_SETUP.md` for Sheets API
Configure OAuth in Google Cloud Console:
- Create OAuth 2.0 credentials
- Add authorized redirect URIs
- Enable necessary APIs

## Phase 2: Environment Configuration

### 2.1 Create Production Environment File
Copy `.env.production.example` to `.env.production` and fill in all values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Claude AI
CLAUDE_API_KEY=sk-ant-api...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEEKLY_PRICE_ID=price_...
STRIPE_MONTHLY_PRICE_ID=price_...

# Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

## Phase 3: Deploy to Render (LEGACY - Use Vercel Instead)

**⚠️ This section is archived. Use Vercel deployment instead.**

### 3.1 Prepare Repository
1. Commit all changes (without .env files!)
2. Push to GitHub
3. ~~Ensure `render.yaml` is in root directory~~ (Removed - now using `vercel.json`)

### 3.2 Connect to Render
1. Log in to [https://render.com](https://render.com)
2. Click "New +" > "Blueprint"
3. Connect your GitHub repository
4. Select the repository with your code

### 3.3 Configure Environment Variables
In Render Dashboard:
1. Go to your service > Environment
2. Add all environment variables from `.env.production`
3. Use "Add Secret File" for multi-line values like private keys

### 3.4 Deploy
1. Click "Manual Deploy" > "Deploy latest commit"
2. Monitor build logs for errors
3. Wait for "Live" status

## Phase 4: Post-Deployment Configuration

### 4.1 Configure Stripe Webhooks
1. In Stripe Dashboard, add webhook endpoint:
   ```
   https://yourdomain.onrender.com/api/subscriptions/webhook
   ```
2. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed

### 4.2 Update OAuth Redirect URLs
Update redirect URLs in:
- Google Cloud Console
- Supabase Authentication settings

### 4.3 Configure Custom Domain (Optional)
1. In Render Dashboard > Settings > Custom Domain
2. Add your domain
3. Configure DNS records as instructed

## Phase 5: Testing

### 5.1 Critical Path Testing
- [ ] User registration (email and Google OAuth)
- [ ] Login/logout flow
- [ ] Free trial activation
- [ ] Stripe checkout (use test cards)
- [ ] Question generation
- [ ] AI feedback generation
- [ ] Practice buddy matching
- [ ] Data export to Google Sheets

### 5.2 Test Payment Flows
Use Stripe test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

### 5.3 Performance Testing
- [ ] Page load times < 3s
- [ ] API response times < 1s
- [ ] Concurrent user testing
- [ ] Mobile responsiveness

## Phase 6: Monitoring & Maintenance

### 6.1 Set Up Monitoring
1. Enable Render health checks
2. Set up uptime monitoring (UptimeRobot, Pingdom)
3. Configure error tracking (Sentry)
4. Set up analytics (Google Analytics, Mixpanel)

### 6.2 Regular Maintenance
- Weekly: Check error logs
- Monthly: Review usage metrics
- Quarterly: Security updates
- Ongoing: User feedback implementation

## Troubleshooting

### Build Failures
```bash
# Check build command in render.yaml
build: npm install && npm run build

# Ensure all dependencies are in package.json
npm install --save [missing-package]
```

### Environment Variable Issues
- Check for typos in variable names
- Ensure multi-line values are properly formatted
- Verify all required variables are set

### Database Connection Issues
- Verify Supabase URL and keys
- Check network policies in Supabase
- Ensure RLS policies are configured

### Payment Issues
- Verify Stripe webhook secret
- Check webhook endpoint URL
- Review Stripe logs for errors

## Rollback Procedure

If issues occur:
1. In Render Dashboard > Deploys
2. Find last working deployment
3. Click "Rollback to this deploy"
4. Investigate issues in staging environment

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Supabase)
- [ ] XSS prevention (React handles this)
- [ ] CORS properly configured
- [ ] Regular dependency updates

## Launch Checklist

### Pre-Launch
- [ ] All services configured and tested
- [ ] Payment processing verified
- [ ] Email notifications working
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Documentation updated

### Launch Day
- [ ] Deploy to production
- [ ] Verify all critical paths
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Announce launch

### Post-Launch
- [ ] Monitor user feedback
- [ ] Track conversion metrics
- [ ] Address any issues quickly
- [ ] Plan feature updates

## Support Contacts

- Render Support: support@render.com
- Supabase Support: support@supabase.com
- Stripe Support: support.stripe.com
- Your Team: [Add contact info]

## Congratulations! 
Your Interview Prep Platform is now live in production!