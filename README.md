# NPF EOD CBRN Personnel and Equipment Management System

A restricted, production-ready internal law enforcement administrative C2 platform built for the **Nigeria Police Force Explosive Ordnance Disposal and Chemical, Biological, Radiological and Nuclear (EOD CBRN) Command**.

---

## 🛡️ Key Features & System Modules

1. **National Master Nominal Roll (26 Principal Headings)**
   - Section A (Personal & Contact): `AP/F/NO`, `RANK`, `NAME`, `EDU. QUALIFICATION`, `STATE OF ORIGIN`, `PHONE NUMBER`, `TRIBE`, `DATE OF BIRTH`, `GEO POL ZONE`, `E-MAIL ADDRESS`, `MSS`.
   - Section B (Career, Deployment & Retirement): `DATE OF ENLIST`, `DATE OF LAST PROM.`, `DATE OF RETIREMENT`, `COMMAND SERVED LAST`, `DUTY POST`, `DATE TRANSFERRED`, `GD/SP`.
   - Section C (Financial, Payroll & Pension - Global Admin Restricted): `G/L`, `BANK NAME`, `EMPLOYEE CODE`, `IPPIS NUMBER`, `PFA`, `PEN PIN`, `NHF NUMBER`, `ASSIGNED UNIT`.

2. **Decoupled Financial Data & Strict RLS**
   - Sensitive financial and payroll fields are isolated in `personnel_financial_details` and protected by Supabase Row Level Security.
   - Field masking prevents unauthorized exposure of IPPIS numbers, bank accounts, and Pen PINs.

3. **Automated Statutory Retirement Scanner Engine (60/35 Rule)**
   - Computes statutory retirement eligibility as `MIN(DOB + 60 Years, Enlistment + 35 Years)`.
   - Daily background scanner identifies officers within **60 days of retirement** and generates high-priority warning alerts for Global Administrators.

4. **Organisational Hierarchy (36 State Bases + FCT)**
   - Supports 36 State Command EOD Bases, optional FCT Command, seaport units, airport units, counter-IED frontline units, and CBRN laboratories without hardcoding UI lists.

5. **Private Gen.60 Form Storage**
   - Gen.60 annual appraisal documents stored in private Supabase Storage buckets with 15-minute temporary signed URLs.

6. **CBRN Equipment Inventory Management**
   - Complete custody tracking, asset tagging, serial number tracking, inspection/calibration schedules, and immutable movement logs.

7. **Immutable Audit Trail**
   - Append-only PostgreSQL audit logging (`audit_logs`) tracking logins, profile views, promotions, transfers, financial access, and equipment transactions.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth + Supabase Storage
- **Security**: Supabase Row Level Security (RLS) on all 35 tables
- **Forms & Validation**: React Hook Form + Zod
- **Tables & Data**: TanStack Table
- **Charts**: Recharts
- **Testing**: Vitest (Unit) & Playwright (E2E)

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-Side Only
```

### 3. Database Migration & Seed
```bash
npx supabase db push
npx supabase db reset
```

### 4. Running Development Server
```bash
npm run dev
# App will run at http://localhost:3000
```

### 5. Running Tests
```bash
npm run test
```
