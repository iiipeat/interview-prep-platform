# Database Migrations

This directory contains PostgreSQL migration files for the Interview Prep Platform database schema.

## Migration Order

Run these migrations in the following order:

1. **001_initial_setup.sql** - PostgreSQL extensions and basic functions
2. **002_user_tables.sql** - User authentication and profile tables
3. **003_subscription_tables.sql** - Subscription plans and user billing
4. **004_question_tables.sql** - Question categories and cached questions
5. **005_session_tables.sql** - Practice sessions and user responses
6. **006_analytics_tables.sql** - Progress tracking and achievements
7. **007_views_functions.sql** - Helper views and utility functions

## Running Migrations

### Using Supabase CLI
```bash
# Apply all migrations
supabase db push

# Or apply individually
supabase db reset --linked
```

### Using psql directly
```bash
# Connect to your database
psql -h your-db-host -U postgres -d your-database

# Run each migration file
\i 001_initial_setup.sql
\i 002_user_tables.sql
\i 003_subscription_tables.sql
\i 004_question_tables.sql
\i 005_session_tables.sql
\i 006_analytics_tables.sql
\i 007_views_functions.sql
```

## Important Notes

- These migrations are designed for PostgreSQL with Supabase
- Row Level Security (RLS) is enabled on all user-facing tables
- All tables include proper indexing for performance
- Timestamps are automatically managed with triggers
- Foreign key constraints ensure data integrity

## Default Data

The migrations include default data for:
- Subscription plans (Free Trial, Weekly Premium, Monthly Premium)
- Question categories (Behavioral, Technical, Situational, etc.)

## Dependencies

- PostgreSQL 13+
- Supabase (for auth.users table reference)
- uuid-ossp extension
- pgcrypto extension