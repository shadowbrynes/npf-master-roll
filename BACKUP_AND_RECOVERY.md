# Backup & Disaster Recovery Protocol

## NPF EOD CBRN Personnel and Equipment Management System

### 1. Database Automated Backup Schedule
- **Point-in-Time Recovery (PITR)**: Supabase PostgreSQL continuous WAL archiving with 30-day retention window.
- **Daily Nightly Physical Backups**: Automated pg_dump snapshot stored in encrypted off-site cloud vault.

### 2. Restoration Procedure
1. Freeze incoming connections in Vercel / server gateway.
2. Restore database state to target timestamp via Supabase CLI:
   ```bash
   npx supabase db restore --project-id <project-id> --timestamp <iso-timestamp>
   ```
3. Verify integrity of audit logs and RLS policies.
