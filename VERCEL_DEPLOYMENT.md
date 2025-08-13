# Vercel Deployment Guide

## Overview
This guide walks through deploying the Interview Prep Platform to Vercel. Vercel provides zero-configuration deployment for Next.js applications with automatic optimization.

## Prerequisites Checklist

- [ ] Vercel account created (free tier available)
- [ ] GitHub repository with your code
- [ ] Supabase project configured
- [ ] Stripe account with products created
- [ ] Claude API key obtained
- [ ] Google OAuth credentials configured
- [ ] Google Sheets API service account created

## Phase 1: Prepare Your Repository

### 1.1 Initialize Git Repository (if not done)
```bash
cd /path/to/interview-prep-platform
git init
git add .
git commit -m "Initial commit for Vercel deployment"
```

### 1.2 Push to GitHub
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/yourusername/interview-prep-platform.git
git branch -M main
git push -u origin main
```

## Phase 2: Deploy to Vercel

### 2.1 Connect GitHub Repository
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it's a Next.js project

### 2.2 Configure Project Settings
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (current directory)
- **Build Command**: `next build` (auto-filled)
- **Output Directory**: `.next` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

## Phase 3: Environment Variables

### 3.1 Add Environment Variables in Vercel Dashboard
Go to your project > Settings > Environment Variables and add:

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Claude AI Configuration
```
CLAUDE_API_KEY=sk-ant-your_claude_api_key_here
```

#### Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_WEEKLY_PRICE_ID=price_your_weekly_price_id_here
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id_here
```

#### Google OAuth Configuration
```
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Google Sheets API Configuration
```
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----
```

#### Application Configuration
```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

### 3.2 Environment Variable Tips
- For multiline values (like private keys), use the text area in Vercel dashboard
- Set variables for all environments: Production, Preview, Development
- Use preview environment for testing before production

## Phase 4: Deploy

### 4.1 Initial Deployment
1. Click "Deploy" in Vercel dashboard
2. Vercel will automatically build and deploy
3. Monitor build logs for any errors
4. Get your deployment URL (e.g., `https://your-app-name.vercel.app`)

### 4.2 Automatic Deployments
- **Main branch**: Deploys to production automatically
- **Other branches**: Create preview deployments
- **Pull requests**: Generate preview URLs for testing

## Phase 5: Post-Deployment Configuration

### 5.1 Update Service Configurations

#### Update Stripe Webhook Endpoint
1. Go to Stripe Dashboard > Webhooks
2. Update endpoint URL to: `https://your-app-name.vercel.app/api/subscriptions/webhook`
3. Ensure these events are selected:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

#### Update Google OAuth Redirect URLs
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add to Authorized redirect URIs:
   - `https://your-app-name.vercel.app/api/auth/callback/google`
   - `https://your-app-name.vercel.app/auth/google/callback`

#### Update Supabase Settings
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Update Site URL: `https://your-app-name.vercel.app`
3. Add to Redirect URLs: `https://your-app-name.vercel.app/auth/callback`

### 5.2 Custom Domain (Optional)
1. In Vercel Dashboard > Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update all service configurations with new domain

## Phase 6: Testing & Verification

### 6.1 Critical Path Testing
Test these core functionalities:

- [ ] Homepage loads correctly
- [ ] User registration (email and Google OAuth)
- [ ] Login/logout flow
- [ ] Dashboard displays user data
- [ ] Practice session creation
- [ ] Question generation (with Claude API)
- [ ] Payment flow (Stripe checkout)
- [ ] Subscription management
- [ ] All page routes work

### 6.2 Performance Testing
- [ ] Lighthouse score > 90
- [ ] Page load times < 3s
- [ ] API response times < 1s
- [ ] Mobile responsiveness

### 6.3 Test Payment Flows
Use Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## Phase 7: Monitoring & Analytics

### 7.1 Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor Core Web Vitals
- Track page performance

### 7.2 Function Monitoring
- Monitor API route performance
- Check function execution times
- Review error logs

### 7.3 External Monitoring
Consider adding:
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot
- **User Analytics**: Google Analytics or Mixpanel

## Phase 8: Continuous Integration

### 8.1 Preview Deployments
- Every pull request gets a preview URL
- Test features before merging to main
- Share preview links with stakeholders

### 8.2 Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
# Create PR on GitHub - gets automatic preview deployment

# After review and merge
git checkout main
git pull origin main
# Automatic production deployment
```

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set correctly

### Runtime Errors
- Check Function logs in Vercel dashboard
- Verify API endpoints are working
- Test database connections

### Performance Issues
- Use Vercel Analytics to identify slow pages
- Optimize images and assets
- Review bundle size

## Vercel-Specific Features

### Edge Functions
- Automatic edge deployment for better performance
- Faster response times globally

### Image Optimization
- Automatic image optimization with `next/image`
- WebP conversion and responsive images

### Preview Deployments
- Every branch gets a unique URL
- Perfect for testing and collaboration

### Zero Configuration
- No build setup required
- Automatic HTTPS
- Global CDN included

## Security Best Practices

- [ ] All secrets in environment variables
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Rate limiting configured in API routes
- [ ] Input validation on all forms
- [ ] Regular dependency updates

## Support & Resources

- **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [https://vercel.com/support](https://vercel.com/support)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Community**: Vercel Discord and GitHub Discussions

## Migration Benefits

### From Render to Vercel:
✅ **Faster deployments** (30 seconds vs 5+ minutes)  
✅ **Better Next.js integration** (zero config vs manual setup)  
✅ **Preview deployments** (automatic for all branches)  
✅ **Edge functions** (better global performance)  
✅ **Built-in analytics** (no additional setup)  
✅ **Generous free tier** (100GB bandwidth, 6,000 build minutes)  

## Congratulations!
Your Interview Prep Platform is now deployed on Vercel with automatic deployments, preview environments, and optimal performance!