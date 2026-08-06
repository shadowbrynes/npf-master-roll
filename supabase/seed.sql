-- NPF EOD CBRN Personnel and Equipment Management System
-- Fictional Demonstration Seed Script

INSERT INTO public.commands (id, code, name, description)
VALUES ('11111111-1111-4111-a111-111111111111', 'EOD-NAT-HQ', 'NATIONAL EOD CBRN COMMAND HEADQUARTERS', 'Central Command and C2 Node')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.state_bases (id, command_id, base_code, base_name, state, location, is_fct, status)
VALUES
('22222222-2222-4222-a222-222222222222', '11111111-1111-4111-a111-111111111111', 'BASE-LAGOS-01', 'LAGOS APAPA SEA PORT EOD CBRN TACTICAL BASE', 'LAGOS', 'APAPA / IKEJA', false, 'active'),
('33333333-3333-4333-a333-333333333333', '11111111-1111-4111-a111-111111111111', 'BASE-FCT-00', 'NATIONAL EOD CBRN COMMAND HEADQUARTERS ABUJA', 'FCT ABUJA', 'ABUJA', true, 'active'),
('44444444-4444-4444-a444-444444444444', '11111111-1111-4111-a111-111111111111', 'BASE-BORNO-02', 'MAIDUGURI COUNTER IED FORWARD OPERATING BASE', 'BORNO', 'MAIDUGURI', false, 'active')
ON CONFLICT (base_code) DO NOTHING;

INSERT INTO public.units (id, base_id, unit_code, unit_name, unit_type, status)
VALUES
('55555555-5555-4555-a555-555555555555', '22222222-2222-4222-a222-222222222222', 'UNIT-APAPA-01', 'APAPA SEA PORT CBRN INSPECTION UNIT', 'SEAPORT', 'active'),
('66666666-6666-4666-a666-666666666666', '33333333-3333-4333-a333-333333333333', 'UNIT-ABUJA-00', 'NATIONAL CBRN RESPONSE TEAM', 'HEADQUARTERS', 'active')
ON CONFLICT (unit_code) DO NOTHING;

INSERT INTO public.roles (name, description) VALUES
('global_admin', 'Full national administrative authority'),
('state_admin', 'State Command Base isolation authority'),
('unit_admin', 'Unit level operational authority'),
('equipment_officer', 'Store and equipment inventory custody authority'),
('personnel', 'Self service personnel dossier access'),
('auditor', 'Read-only audit trail reviewer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.equipment_categories (name, description) VALUES
('EOD Disruptors & Bomb Suits', 'Explosive Ordnance Disposal protective and disruption gear'),
('CBRN Detectors & Mass Spectrometers', 'Chemical, Biological, Radiological and Nuclear detection sensors'),
('Counter IED Robots', 'Unmanned Remote Controlled Tactical Response Vehicles')
ON CONFLICT (name) DO NOTHING;

-- Fictional Demonstration Officers
INSERT INTO public.personnel (
    id, apf_no, rank, full_name, gender, educational_qualification, state_of_origin, lga, tribe, geopolitical_zone,
    date_of_birth, phone_number, email_address, mss, date_of_enlistment, date_of_last_promotion, retirement_date,
    calculated_retirement_date, command_served_last, duty_post, date_transferred_to_command, gd_sp, base_id, unit_id, status
) VALUES
(
    '77777777-7777-4777-a777-777777777777', 'AP/117369', 'CSP', 'DESMOND AGBALA', 'MALE', 'BSC POLICE SCIENCE', 'FCT', 'ABUJA MUNICIPAL', 'OMAH', 'NORTH CENTRAL',
    '1976-12-22', '08033752122', 'desmond.agbala@npf.gov.ng', 'BENIN CITY', '1999-12-01', '2024-08-08', '2034-12-01',
    '2034-12-01', 'ASABA INTER. AIRPORT', 'COMMANDER', '2023-09-13', 'GD', '22222222-2222-4222-a222-222222222222', '55555555-5555-4555-a555-555555555555', 'active'
),
(
    '88888888-8888-4888-a888-888888888888', 'AP/190509', 'SP', 'RACHAEL ARIWERIOKUMA', 'FEMALE', 'BSC', 'RIVERS', 'OKRIKA', 'OKRIKA', 'SOUTH SOUTH',
    '1985-07-18', '08030986847', 'rachael.ariweriokuma@npf.gov.ng', 'JOS', '2016-12-31', '2024-12-18', '2045-07-18',
    '2045-07-18', 'INTER. AIRPORT IKEJA', '2/IC COMMANDER', '2025-03-03', 'GD', '22222222-2222-4222-a222-222222222222', '55555555-5555-4555-a555-555555555555', 'active'
)
ON CONFLICT (apf_no) DO NOTHING;

INSERT INTO public.personnel_financial_details (personnel_id, grade_level, bank_name, account_number, employee_code, ippis_number, pfa, pen_pin, nhf_number)
VALUES
('77777777-7777-4777-a777-777777777777', '13', 'UBA', '0020155223', 'NP144326', 'PF027452', 'NPF PENSION', 'PEN100060086', 'NHF131696142'),
('88888888-8888-4888-a888-888888888888', '12', 'FIRST BANK', '0020432425', 'NP316462', 'PF0297478', 'NPF PENSION', 'PEN200823882', 'NHF132203324')
ON CONFLICT (personnel_id) DO NOTHING;
