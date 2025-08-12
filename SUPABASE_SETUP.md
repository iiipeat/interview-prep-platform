# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Enter project details:
   - Project name: `interview-prep-platform`
   - Database Password: [Generate a strong password]
   - Region: Choose closest to your users
   - Pricing Plan: Free tier to start

## Step 2: Database Setup

Run the following SQL commands in the Supabase SQL Editor:

### 1. Run Migration Scripts
Navigate to `agent-workspaces/database/migrations/` and run each SQL file in order:
- 001_initial_setup.sql
- 002_user_tables.sql
- 003_subscription_tables.sql
- 004_question_tables.sql
- 005_session_tables.sql
- 006_analytics_tables.sql
- 007_views_functions.sql
- 008_simplified_subscription.sql

### 2. Enable Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all questions" ON questions
  FOR SELECT USING (true);
```

## Step 3: Authentication Setup

### Enable Google OAuth:
1. Go to Authentication > Providers in Supabase Dashboard
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)
4. Set redirect URL: `https://yourdomain.com/auth/callback`

### Configure Auth Settings:
1. Go to Authentication > Settings
2. Set Site URL: `https://yourdomain.com`
3. Add Redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

## Step 4: Get API Keys

1. Go to Settings > API in Supabase Dashboard
2. Copy the following keys:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY (keep secret!)

## Step 5: Configure Storage (Optional)

If you plan to store user avatars or resume files:

1. Go to Storage in Supabase Dashboard
2. Create buckets:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES 
     ('avatars', 'avatars', true),
     ('resumes', 'resumes', false);
   ```

3. Set up storage policies:
   ```sql
   CREATE POLICY "Users can upload own avatar" ON storage.objects
     FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   
   CREATE POLICY "Users can view avatars" ON storage.objects
     FOR SELECT USING (bucket_id = 'avatars');
   
   CREATE POLICY "Users can upload own resume" ON storage.objects
     FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
   
   CREATE POLICY "Users can view own resume" ON storage.objects
     FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

## Step 6: Test Connection

Create a test file `test-supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'your_project_url',
  'your_anon_key'
);

async function testConnection() {
  const { data, error } = await supabase
    .from('users')
    .select('count');
  
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('Connection successful! User count:', data);
  }
}

testConnection();
```

## Step 7: Environment Variables

Add to your `.env.local` or `.env.production`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### Common Issues:

1. **Authentication errors**: Check that your redirect URLs match exactly
2. **RLS errors**: Ensure policies are correctly set up
3. **Connection errors**: Verify API keys and project URL
4. **Migration errors**: Run migrations in order, check for dependencies

### Useful SQL Queries:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- View current RLS policies
SELECT * FROM pg_policies;

-- Check user count
SELECT COUNT(*) FROM users;

-- View recent sign-ups
SELECT email, created_at FROM users ORDER BY created_at DESC LIMIT 10;
```

## Next Steps

1. Set up Stripe integration
2. Configure Claude AI
3. Set up monitoring and alerts
4. Configure backup strategy