# Production Deployment Guide

## NPF EOD CBRN Personnel and Equipment Management System

### 1. Environment Variables Configuration
Configure the following environment variables in Vercel / hosting provider:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Server-Side ONLY
NEXT_PUBLIC_APP_URL=https://eod-cbrn-management.gov.ng
```

### 2. Vercel Production Deployment
1. Connect GitHub repository to Vercel.
2. Select **Next.js** framework preset.
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Deploy application and run verification integration test suite (`npm run test`).
