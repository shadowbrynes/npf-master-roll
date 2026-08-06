# Security Architecture & Cybersecurity Specifications

## NPF EOD CBRN Personnel and Equipment Management System

### 1. Defense-in-Depth Architecture
- **Supabase Row Level Security (RLS)**: Mandatory RLS enabled on all 35 PostgreSQL database tables.
- **Data Isolation**: Strict scope checks (`state_base_id`, `unit_id`) prevent horizontal and vertical privilege escalation (IDOR attacks).
- **Private Storage**: Gen.60 documents and personnel photos stored in private storage buckets; accessed exclusively via 15-minute temporary signed URLs.
- **Privileged Server Actions**: Privileged mutations (AP/F/NO changes, rank promotions, base transfers, retirement overrides) execute via server-side Edge Functions / Next.js Server Actions using server-validated credentials.

### 2. Authentication & Credential Hygiene
- **Zero Client Secret Exposure**: `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to backend server contexts and never rendered in client bundles.
- **Multifactor Authentication (MFA)**: Enforced for Global Administrators and System Administrators.
- **Account Lockout & Audit**: Repeated failed sign-in attempts automatically suspend access and create security audit records.

### 3. Financial Field Masking & Privacy Protection
- **Decoupled Financial Schema**: Banking details, IPPIS numbers, Pen PINs, and NHF numbers are isolated in `personnel_financial_details`.
- **Field-Level Masking**: Regular users view masked strings (e.g., `PF•••••457`). Unmasking requires explicit Global Admin financial authorization.

### 4. Immutable Security Audit Trail
- **Append-Only Audit Logging**: All sign-in events, profile views, record edits, promotions, transfers, document downloads, and financial unmasking operations append to `audit_logs`.
- **Tamper Resistance**: Audit log tables allow `SELECT` and `INSERT` only for authorized admins; `UPDATE` and `DELETE` operations are disabled via database triggers.
