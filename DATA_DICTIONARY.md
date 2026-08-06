# Database Data Dictionary

## NPF EOD CBRN Personnel and Equipment Management System

### 1. `profiles`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, References `auth.users(id)` | Authentication User ID |
| `personnel_id` | `uuid` | Unique, References `personnel(id)` | Associated Personnel Record |
| `email` | `text` | Unique, Not Null | User Authentication Email |
| `full_name` | `text` | Not Null | User Display Name |
| `role` | `text` | Not Null, Default `'personnel'` | System Access Role |
| `state_base_id` | `uuid` | References `state_bases(id)` | Assigned Base Scope |
| `unit_id` | `uuid` | References `units(id)` | Assigned Unit Scope |
| `financial_access_granted` | `boolean` | Default `false` | Financial Permission Flag |
| `created_at` | `timestamptz` | Default `now()` | Record Creation Timestamp |

### 2. `personnel` (Public Master Roll Record)
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Personnel Unique Identifier |
| `apf_no` | `text` | Unique, Not Null | AP / F / Service Number |
| `rank` | `text` | Not Null | Police Rank (CSP, SP, INSPR, etc.) |
| `full_name` | `text` | Not Null | Officer Full Name |
| `educational_qualification` | `text` | Nullable | Educational Degree / SSCE |
| `state_of_origin` | `text` | Not Null | State of Origin |
| `lga` | `text` | Nullable | Local Government Area |
| `tribe` | `text` | Nullable | Tribe / Ethnicity |
| `geopolitical_zone` | `text` | Nullable | Geopolitical Zone |
| `date_of_birth` | `date` | Not Null | Officer Date of Birth |
| `phone_number` | `text` | Not Null | Contact Telephone Number |
| `email_address` | `text` | Nullable | Contact Email Address |
| `mss` | `text` | Nullable | Medical & Service Station |
| `date_of_enlistment` | `date` | Not Null | Date of First Enlistment |
| `date_of_last_promotion` | `date` | Nullable | Date of Last Promotion |
| `retirement_date` | `date` | Not Null | Effective Statutory Retirement Date |
| `calculated_retirement_date` | `date` | Not Null | Algorithmic Statutory Date |
| `command_served_last` | `text` | Nullable | Last Command Served |
| `duty_post` | `text` | Nullable | Operational Duty Post |
| `date_transferred_to_command` | `date` | Nullable | Transfer Date |
| `gd_sp` | `text` | Default `'GD'` | General Duty or Specialist |
| `base_id` | `uuid` | References `state_bases(id)` | Current State Base Assignment |
| `unit_id` | `uuid` | References `units(id)` | Current Unit Assignment |
| `status` | `text` | Default `'active'` | Service Status (active, retired, etc.) |
| `is_archived` | `boolean` | Default `false` | Soft Deletion Flag |

### 3. `personnel_financial_details` (Restricted Financial Data Table)
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Record Identifier |
| `personnel_id` | `uuid` | Unique, References `personnel(id)` | Associated Personnel Record |
| `grade_level` | `text` | Nullable | Salary Grade Level (G/L) |
| `bank_name` | `text` | Nullable | Commercial / NPF MFB Bank Name |
| `account_number` | `text` | Nullable | Bank Account Number |
| `employee_code` | `text` | Unique | NPF Employee Code |
| `ippis_number` | `text` | Unique | Federal IPPIS Number |
| `pfa` | `text` | Nullable | Pension Fund Administrator |
| `pen_pin` | `text` | Unique | Pension PIN |
| `nhf_number` | `text` | Unique | National Housing Fund Number |

### 4. `equipment_items` (CBRN & EOD Equipment Inventory)
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Equipment Unit Identifier |
| `asset_tag` | `text` | Unique, Not Null | Tactical Asset Tracking Tag |
| `name` | `text` | Not Null | Equipment Name |
| `category` | `text` | Not Null | Category (EOD, CBRN, Detectors, Suits) |
| `serial_number` | `text` | Unique, Not Null | Manufacturer Serial Number |
| `base_id` | `uuid` | References `state_bases(id)` | Current Custody Base |
| `unit_id` | `uuid` | References `units(id)` | Current Custody Unit |
| `assigned_officer_id` | `uuid` | References `personnel(id)` | Assigned Custodian Officer |
| `condition` | `text` | Default `'serviceable'` | Physical Condition |
| `status` | `text` | Default `'available'` | Operational Availability |
| `next_inspection_date` | `date` | Nullable | Scheduled Inspection Date |
| `next_maintenance_date` | `date` | Nullable | Scheduled Maintenance Date |
