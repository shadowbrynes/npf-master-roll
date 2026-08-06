# User Roles & Access Control Permissions Matrix

## NPF EOD CBRN Personnel and Equipment Management System

| Role | Scope | Personnel Records | Financial / Payroll / Pension | Gen.60 Forms | Equipment Inventory | Retirement Alerts | Audit Trail Logs | System Settings |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Global Administrator** | National (All Bases & Units) | Full CRUD, Transfer, Archive, Restore | Full Unrestricted Access & Mask Override | View, Approve, Version All Forms | Full National Inventory Control | National 60-Day Warning Roster | Full Immutable Log Access | Full Configuration Control |
| **State / Base Administrator** | Assigned State Base Only | CRUD within Assigned State Base | Access Only if Explicitly Granted by Global Admin | Upload & View within State Base | View & Manage Base Equipment | 60-Day Alerts for Assigned Base | Base Activity Trail Access | Base Unit Management |
| **Unit Administrator** | Assigned Tactical Unit Only | Update Approved Non-Financial Fields | No Access | View Unit Approved Forms | View Unit Assigned Equipment | Unit Retirement Reminders | Unit Activity Trail Access | None |
| **Equipment / Store Officer** | Assigned Base / Store Scope | Read-Only Basic Officer Identifiers | No Access | No Access | Register, Issue, Return, Transfer, Inspect | No Access | Equipment Transaction Logs | None |
| **Personnel User (Self-Service)** | Individual Self Dossier Only | Read-Only Self Dossier, Request Correction | Masked Self Financial Info | View Approved Personal Forms | View Personal Assigned Gear | View Self Retirement Date | Personal Security Events | Self Contact Update |
| **Auditor / Read-Only Reviewer** | Approved Scope | Read-Only Approved Dossiers | Masked Read-Only | Read-Only Approved Documents | Read-Only Approved Equipment | View Retirement Roster | Full Audit Trail View | None |

## Permission Enforcement Architecture
- **Supabase Row Level Security (RLS)**: Enforced directly on PostgreSQL tables using `auth.uid()` and JWT metadata.
- **Client-Side Permission Guards**: UI elements conditionally render based on server-verified session permissions.
- **Server-Side Action Validation**: All API routes and Server Actions re-validate authorization headers before processing state mutations.
