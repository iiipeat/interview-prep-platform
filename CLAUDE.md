# Interview Prep Platform - Project Memory

## 🎯 Project Overview
**Mission**: Build an AI-powered interview preparation website for ANY industry (not just tech/banking)
**Target Users**: Job seekers from all industries and experience levels
**Core Value**: Industry-agnostic, personalized interview preparation with AI

### Business Model
- **Free Trial**: 7 days (5 questions/day limit)
- **Weekly Plan**: $9/week (20 questions/day)
- **Monthly Plan**: $29/month (unlimited questions + Practice Buddy feature)
- **Authentication**: Google OAuth + Email/Password
- **Design Philosophy**: Keep it simple, don't overcomplicate, glass morphism inspired by Linear/Apple

## 👥 Development Team (Claude Code Agents)

### Project Manager Agent
- **Role**: Overall project coordination and planning
- **Responsibilities**: Task prioritization, timeline management, feature scoping
- **Status**: Actively managing project roadmap and todos

### Frontend Developer Agent  
- **Role**: UI/UX implementation and component development
- **Responsibilities**: React components, Tailwind styling, responsive design, glass morphism effects
- **Recent Work**: Fixed text visibility issues, built dashboard, created auth pages

### Backend Developer Agent
- **Role**: Server-side logic and data management
- **Responsibilities**: API routes, database schema, authentication flow, subscription management
- **Recent Work**: Set up mock Supabase, created API structure, implemented auth

### AI Integration Agent
- **Role**: AI-powered features and Claude API integration
- **Responsibilities**: Question generation, answer analysis, feedback system, difficulty adjustment
- **Next Tasks**: Implement question generation API, build feedback system

### QA & Testing Agent
- **Role**: Quality assurance and bug fixes
- **Responsibilities**: Testing user flows, fixing bugs, ensuring cross-browser compatibility
- **Recent Work**: Fixed text contrast issues, resolved routing errors

### DevOps Agent
- **Role**: Deployment and infrastructure
- **Responsibilities**: Hosting optimization, performance, CI/CD, cost management
- **Focus**: Keep hosting costs minimal while maintaining quality

## ✅ Completed Features

### 1. Homepage (`/src/app/page.tsx`)
- Industry-agnostic messaging ("Job Interview" not "Tech Interview")
- Clear value proposition for all career paths
- Glass morphism design with gradient backgrounds
- CTA buttons for signup and demo

### 2. Authentication System
- **Signup Page** (`/src/app/signup/page.tsx`)
  - Google OAuth integration
  - Email/password registration
  - 7-day free trial activation
  - Profile setup flow (optional)
- **Login Page** (`/src/app/login/page.tsx`)
  - Google OAuth and email/password
  - Remember me functionality
  - Demo account credentials displayed

### 3. Dashboard (`/src/app/dashboard/page.tsx`)
- Subscription status display (trial/weekly/monthly/expired)
- Daily question limits tracking
- Stats grid (total questions, streak, achievements, success rate)
- Recent practice sessions
- Quick action cards
- Trial days remaining alert

### 4. Design System
- **Components** (`/src/components/ui/`)
  - GlassCard with blur effects
  - Button with variants
  - Input with glass styling
  - Navigation with responsive menu
- **Styling** (`/src/app/globals.css`)
  - Glass morphism utilities
  - Enhanced text contrast for visibility
  - Gradient text effects
  - Proper input field visibility

### 5. Mock Implementations
- **Mock Supabase** (`/src/lib/mock-supabase.ts`) - Handles auth without actual Supabase
- **Mock Icons** (`/src/lib/icons.tsx`) - Provides icons without lucide-react package

## 🐛 Known Issues & Fixes Applied

### Fixed Issues
1. **Text Visibility Problems**
   - Issue: "It is very hard to see some of the text"
   - Fix: Updated all text colors to use darker shades (text-gray-700, text-gray-900)
   - Files updated: dashboard, signup, login pages

2. **Google Button Text**
   - Issue: "You can't see the text in the google tab"
   - Fix: Added `bg-white text-gray-700 font-medium` to Google OAuth buttons

3. **White Text on Cards**
   - Issue: "Practice Questions" and "Practice Buddy" text was white
   - Fix: Added `text-gray-900` to all card headings

### Current Issues
1. **Practice Page Missing**
   - Error: Clicking "Practice" gives 404 error
   - Need: Create `/src/app/practice/page.tsx`

2. **System Design References**
   - Location: Navigation menu and question generator
   - Action: Remove all system design mentions

3. **Missing Dependencies**
   - Some components import from packages not installed
   - Using mock implementations as workaround

## 📋 Todo List Status

1. ✅ Update homepage content for all industries
2. ✅ Build authentication pages (signup/login)  
3. ✅ Create dashboard with subscription limits
4. ✅ Build practice interface with question limits - FIXED 404 ERROR
5. ✅ Create Mock Interviews page
6. ✅ Create pricing page with tier comparison
7. ✅ Add Practice Buddy page (monthly only)
8. ✅ Build achievements page with gamification
9. ✅ Create History page for tracking progress
10. ✅ Build Resources Hub with curated content
11. ✅ Add onboarding flow to dashboard

## 🚀 Completed Features (This Session)

### ✅ Core Pages Implemented
1. **Practice Page** - 3-step flow with Quick Start
2. **Mock Interviews** - 15/30/45 min simulations
3. **Resources Hub** - Quick Wins & Deep Dives
4. **Achievements** - Gamification with progress tracking
5. **History** - Performance tracking and trends
6. **Practice Buddy** - Peer practice for monthly users
7. **Pricing Page** - Clear tier comparison
8. **Onboarding Flow** - New user personalization

### 🔧 Next Steps for Production

1. **API Integration**
   - Connect to real Claude API for question generation
   - Implement actual AI feedback analysis
   - Real-time Practice Buddy WebRTC

2. **Payment Integration**
   - Stripe checkout flow
   - Subscription management
   - Billing portal

3. **Database Setup**
   - Supabase authentication
   - User data persistence
   - Question caching

4. **Performance Optimization**
   - Image optimization
   - Code splitting
   - Progressive Web App features

## 🛠 Technical Details

### File Structure
```
interview-prep-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx (Homepage)
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── pricing/
│   │   └── [MISSING: practice/, mock-interviews/, resources/, etc.]
│   ├── components/
│   │   ├── ui/ (Design system components)
│   │   └── [NEED: practice/, payments/, etc.]
│   └── lib/
│       ├── mock-supabase.ts
│       ├── icons.tsx
│       └── [NEED: ai/, stripe integration]
```

### Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLAUDE_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Key Features by Subscription Tier

| Feature | Free Trial (7 days) | Weekly ($9) | Monthly ($29) |
|---------|-------------------|-------------|---------------|
| Questions/Day | 5 | 20 | Unlimited |
| Industries | 3 | 10 | All |
| Practice Buddy | ❌ | ❌ | ✅ |
| Resume Upload | ❌ | ❌ | ✅ |
| Achievement System | ✅ | ✅ | ✅ |
| AI Feedback | Basic | Advanced | Advanced |
| Progress Tracking | ✅ | ✅ | ✅ |

## 📝 Important Context

### User Requirements History
1. "I want to make a website that does interview prep for ANY industry"
2. "Keep it simple, don't overcomplicate"
3. "Use Claude Code sub-agents as a virtual development team"
4. "Remove system design section - not needed"
5. "Fix text visibility issues" (multiple times)
6. "Practice page gives error" - needs immediate fix

### Design Decisions
- Glass morphism inspired by Linear and Apple
- Blue to purple gradients
- Clean, minimalist interface
- Mobile-responsive
- Accessibility-focused (after fixing contrast issues)

### Development Approach
- Start with mock implementations to avoid dependency issues
- Focus on core functionality first
- Keep hosting costs minimal
- Use Next.js 14 App Router for performance
- TypeScript for type safety
- Tailwind CSS for rapid styling

## 🔄 Session Recovery Instructions

When returning to this project:
1. Navigate to project directory
2. Run `claude` or `claude --resume`
3. Claude will read this file and have full context
4. Continue from the todo list and next steps

### Current Working Directory
`/Users/iiipeatdorton/Downloads/Claude Apps/Interview Website/interview-prep-platform`

### Last Known Server Status
- Was running on port 3001 (port 3000 had issues)
- Use `npm run dev -- -p 3001` to start

---
*Last Updated: Current Session*
*User: @iiipeatdorton*
*Project Status: In Active Development*