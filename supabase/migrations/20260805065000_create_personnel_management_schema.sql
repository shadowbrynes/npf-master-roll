create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    role text not null default 'personnel'
        check (
            role in (
                'super_admin',
                'system_admin',
                'personnel_admin',
                'base_admin',
                'unit_admin',
                'supervisor',
                'personnel',
                'auditor'
            )
        ),
    status text not null default 'active'
        check (status in ('active', 'inactive', 'suspended')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.bases (
    id uuid primary key default gen_random_uuid(),
    base_code citext not null unique,
    base_name text not null,
    location text,
    state text,
    status text not null default 'active'
        check (status in ('active', 'inactive')),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.units (
    id uuid primary key default gen_random_uuid(),
    unit_code citext not null unique,
    unit_name text not null,
    base_id uuid not null references public.bases(id)
        on update cascade
        on delete restrict,
    command_name text,
    location text,
    description text,
    status text not null default 'active'
        check (status in ('active', 'inactive')),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.personnel (
    id uuid primary key default gen_random_uuid(),

    apf_no citext not null unique,
    rank text not null,
    full_name text not null,

    state_of_origin text,
    lga text,
    tribe text,
    geopolitical_zone text,

    date_of_birth date not null,
    date_of_enlistment date not null,
    date_of_last_promotion date,
    calculated_retirement_date date,
    retirement_date date,
    retirement_basis text,
    retirement_status text,
    retirement_date_source text,
    retirement_override_reason text,

    command_served_last text,
    date_transferred_to_command date,
    educational_qualification text,
    gd_sp text,
    grade_level text,
    duty_post text,

    employee_code citext unique,

    base_id uuid references public.bases(id)
        on update cascade
        on delete restrict,

    unit_id uuid references public.units(id)
        on update cascade
        on delete restrict,

    owner_uid uuid references auth.users(id)
        on update cascade
        on delete set null,

    status text not null default 'active'
        check (
            status in (
                'active',
                'retired',
                'inactive',
                'deceased',
                'transferred',
                'suspended'
            )
        ),

    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint valid_enlistment_date
        check (date_of_enlistment >= date_of_birth),

    constraint valid_retirement_date
        check (
            retirement_date is null
            or retirement_date >= date_of_enlistment
        ),

    constraint valid_promotion_date
        check (
            date_of_last_promotion is null
            or date_of_last_promotion >= date_of_enlistment
        )
);

create table if not exists public.personnel_private (
    personnel_id uuid primary key
        references public.personnel(id)
        on delete cascade,

    account_number text,
    bank_name text,
    ippis_number citext unique,
    pfa text,
    pen_pin citext,
    nhf_number citext,
    mss text,
    email_address citext,
    phone_number text,

    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.retirement_settings (
    id uuid primary key default gen_random_uuid(),
    mandatory_retirement_age integer not null default 60,
    maximum_service_years integer not null default 35,
    organisational_timezone text not null default 'Africa/Lagos',
    notification_months integer[] not null
        default array[12, 6, 4, 2, 1],
    is_active boolean not null default true,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint valid_retirement_age
        check (mandatory_retirement_age between 18 and 100),

    constraint valid_service_years
        check (maximum_service_years between 1 and 80)
);

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_uid uuid references auth.users(id) on delete set null,
    actor_role text,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    result text not null,
    changed_fields jsonb,
    request_id text,
    ip_address inet,
    created_at timestamptz not null default now()
);

create index if not exists personnel_base_id_idx
    on public.personnel(base_id);

create index if not exists personnel_unit_id_idx
    on public.personnel(unit_id);

create index if not exists personnel_status_idx
    on public.personnel(status);

create index if not exists personnel_retirement_date_idx
    on public.personnel(retirement_date);

create index if not exists personnel_created_at_idx
    on public.personnel(created_at desc);

create index if not exists units_base_id_idx
    on public.units(base_id);

create index if not exists units_status_idx
    on public.units(status);

create index if not exists bases_status_idx
    on public.bases(status);

create index if not exists audit_logs_actor_uid_idx
    on public.audit_logs(actor_uid);

create index if not exists audit_logs_entity_idx
    on public.audit_logs(entity_type, entity_id);

create index if not exists audit_logs_created_at_idx
    on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at
    on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists bases_set_updated_at
    on public.bases;

create trigger bases_set_updated_at
before update on public.bases
for each row execute function public.set_updated_at();

drop trigger if exists units_set_updated_at
    on public.units;

create trigger units_set_updated_at
before update on public.units
for each row execute function public.set_updated_at();

drop trigger if exists personnel_set_updated_at
    on public.personnel;

create trigger personnel_set_updated_at
before update on public.personnel
for each row execute function public.set_updated_at();

drop trigger if exists personnel_private_set_updated_at
    on public.personnel_private;

create trigger personnel_private_set_updated_at
before update on public.personnel_private
for each row execute function public.set_updated_at();

drop trigger if exists retirement_settings_set_updated_at
    on public.retirement_settings;

create trigger retirement_settings_set_updated_at
before update on public.retirement_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.bases enable row level security;
alter table public.units enable row level security;
alter table public.personnel enable row level security;
alter table public.personnel_private enable row level security;
alter table public.retirement_settings enable row level security;
alter table public.audit_logs enable row level security;

insert into public.retirement_settings (
    mandatory_retirement_age,
    maximum_service_years,
    organisational_timezone
)
select
    60,
    35,
    'Africa/Lagos'
where not exists (
    select 1
    from public.retirement_settings
);