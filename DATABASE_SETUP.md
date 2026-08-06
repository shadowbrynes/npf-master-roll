# Supabase Database Setup & Migration Guide

## NPF EOD CBRN Personnel and Equipment Management System

### 1. Prerequisites
- **Supabase CLI** or **Supabase Cloud Project**.
- PostgreSQL 15+ instance with `pgcrypto` and `pg_cron` extensions enabled.

### 2. Executing Schema Migrations
1. Apply the primary SQL schema and RLS policies:
   ```bash
   npx supabase db push
   # OR apply manually in Supabase SQL Editor using:
   # supabase/migrations/20260806000000_init_schema_and_rls.sql
   ```

2. Seed demonstration fictional data:
   ```bash
   npx supabase db reset
   # OR run:
   # supabase/seed.sql
   ```

### 3. Configuring Storage Buckets
Ensure the following 3 storage buckets are created with **Public Access Disabled**:
- `gen60-documents` (Max size: 10MB; Allowed MIME: `application/pdf`, `image/jpeg`, `image/png`)
- `personnel-photos` (Max size: 5MB; Allowed MIME: `image/jpeg`, `image/png`)
- `equipment-docs` (Max size: 10MB; Allowed MIME: `application/pdf`, `image/jpeg`, `image/png`)

### 4. Configuring PostgreSQL Scheduled Cron Jobs
To enable daily automatic statutory retirement scans (60-day warning alerts) and daily birthday detection:
```sql
SELECT cron.schedule(
  'daily-retirement-and-birthday-check',
  '0 1 * * *', -- Runs every morning at 01:00 AM UTC
  $$ SELECT run_daily_retirement_and_birthday_scans(); $$
);
```
