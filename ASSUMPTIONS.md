# System Assumptions & Operational Constraints

## NPF EOD CBRN Personnel and Equipment Management System

### 1. Organisational Hierarchy & Command Scope
- **National EOD CBRN Headquarters**: Serves as the central command node with national oversight across all 36 State Command Bases and the Federal Capital Territory (FCT) Command.
- **State Bases & Tactical Formations**: All 36 State Bases (plus FCT when enabled by Global Administrator) operate under strict data isolation boundaries.
- **Tactical Sub-Units**: Seaport units (e.g., Apapa Sea Port EOD Base), Airport units (e.g., MMIA Ikeja), Counter-IED Frontline units (e.g., Maiduguri FOB), and Explosive/CBRN Laboratories are modeled as child units linked to parent State Commands or Headquarters via foreign key relationships.

### 2. Authentication & Access Delegation
- **Unrestricted Self-Registration Disabled**: No public registration endpoints exist. Accounts are created exclusively by Global Administrators or State/Base Administrators.
- **Single Account per Officer**: Each authentication user (`auth.users`) maps 1:1 to exactly one profile (`public.profiles`) and personnel record (`public.personnel`).
- **MFA Enforcement**: Multifactor authentication (MFA) is strictly mandated for Global Administrators and System Administrators.

### 3. Statutory Retirement Rules Policy
- **Default 60/35 Formula**: In accordance with NPF Regulations and Public Service Rules (PSR 020810), statutory retirement dates are automatically calculated as the earlier of:
  - Age 60 years from Date of Birth.
  - 35 years of service from Date of Enlistment / Date of First Appointment.
- **Configurable Overrides**: Exceptional extensions, judicial mandates, or special service overrides can only be applied by a Global Administrator with mandatory audit logging and reason recording.
- **2-Month Notice Window**: Automatic background scanning triggers high-priority alerts 60 days before an officer's effective retirement date.

### 4. Data Privacy & Financial Field Masking
- **Strict Financial Isolation**: Sensitive banking, salary grade level (G/L), employee code, IPPIS number, PFA, Pen PIN, and NHF numbers are stored in a dedicated `personnel_financial_details` table protected by RLS.
- **Field Masking**: Regular officers and unprivileged personnel view masked values (e.g., `••••••••3107`) unless explicit permission is granted by a Global Administrator.

### 5. Document Storage & Security
- **Private Storage Buckets**: Gen.60 annual appraisal forms, personnel photos, and equipment compliance documents are stored in private Supabase Storage buckets (`gen60-documents`, `personnel-photos`, `equipment-docs`).
- **Short-Lived Signed URLs**: Public URLs are disabled. Media and files are accessed exclusively via temporary signed URLs with 15-minute expiration windows.
