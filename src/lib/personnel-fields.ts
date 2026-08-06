export interface PersonnelFieldConfig {
  key: string;
  dbKeyPersonnel?: string;
  dbKeyPrivate?: string;
  label: string;
  section: 'A' | 'B' | 'C' | 'D';
  category: string;
  isRestricted?: boolean;
}

export const PERSONNEL_26_HEADINGS: PersonnelFieldConfig[] = [
  // SECTION A: PERSONAL AND CONTACT INFORMATION
  { key: 'apfNo', dbKeyPersonnel: 'apf_no', label: '1. AP/F/NO', section: 'A', category: 'Personal' },
  { key: 'rank', dbKeyPersonnel: 'rank', label: '2. RANK', section: 'A', category: 'Personal' },
  { key: 'fullName', dbKeyPersonnel: 'full_name', label: '3. NAME', section: 'A', category: 'Personal' },
  { key: 'educationalQualification', dbKeyPersonnel: 'educational_qualification', label: '4. EDU. QUALIFICATION', section: 'A', category: 'Personal' },
  { key: 'stateOfOrigin', dbKeyPersonnel: 'state_of_origin', label: '5. STATE OF ORIGIN', section: 'A', category: 'Personal' },
  { key: 'phoneNumber', dbKeyPrivate: 'phone_number', label: '6. PHONE NUMBER', section: 'A', category: 'Personal' },
  { key: 'tribe', dbKeyPersonnel: 'tribe', label: '7. TRIBE', section: 'A', category: 'Personal' },
  { key: 'dateOfBirth', dbKeyPersonnel: 'date_of_birth', label: '8. DATE OF BIRTH', section: 'A', category: 'Personal' },
  { key: 'geopoliticalZone', dbKeyPersonnel: 'geopolitical_zone', label: '9. GEO POL ZONE', section: 'A', category: 'Personal' },
  { key: 'emailAddress', dbKeyPrivate: 'email_address', label: '10. E-MAIL ADDRESS', section: 'A', category: 'Personal' },
  { key: 'mss', dbKeyPrivate: 'mss', label: '11. MSS', section: 'A', category: 'Personal' },

  // SECTION B: CAREER, DEPLOYMENT AND RETIREMENT
  { key: 'dateOfEnlistment', dbKeyPersonnel: 'date_of_enlistment', label: '12. DATE OF ENLIST', section: 'B', category: 'Career' },
  { key: 'dateOfLastPromotion', dbKeyPersonnel: 'date_of_last_promotion', label: '13. DATE OF LAST PROM.', section: 'B', category: 'Career' },
  { key: 'retirementDate', dbKeyPersonnel: 'retirement_date', label: '14. DATE OF RETIREMENT', section: 'B', category: 'Career' },
  { key: 'commandServedLast', dbKeyPersonnel: 'command_served_last', label: '15. COMMAND SERVED LAST', section: 'B', category: 'Career' },
  { key: 'dutyPost', dbKeyPersonnel: 'duty_post', label: '16. DUTY POST', section: 'B', category: 'Career' },
  { key: 'dateTransferredToCommand', dbKeyPersonnel: 'date_transferred_to_command', label: '17. DATE TRANSFERRED', section: 'B', category: 'Career' },
  { key: 'gdSp', dbKeyPersonnel: 'gd_sp', label: '18. GD/SP', section: 'B', category: 'Career' },

  // SECTION C: FINANCIAL, PAYROLL AND PENSION (GLOBAL ADMIN RESTRICTED)
  { key: 'gradeLevel', dbKeyPersonnel: 'grade_level', label: '19. G/L', section: 'C', category: 'Financial', isRestricted: true },
  { key: 'bankName', dbKeyPrivate: 'bank_name', label: '20. BANK NAME', section: 'C', category: 'Financial', isRestricted: true },
  { key: 'employeeCode', dbKeyPersonnel: 'employee_code', label: '21. EMPLOYEE CODE', section: 'C', category: 'Financial', isRestricted: true },
  { key: 'ippisNumber', dbKeyPrivate: 'ippis_number', label: '22. IPPIS NUMBER', section: 'C', category: 'Financial', isRestricted: true },
  { key: 'pfa', dbKeyPrivate: 'pfa', label: '23. PFA', section: 'C', category: 'Financial', isRestricted: true },
  { key: 'penPin', dbKeyPrivate: 'pen_pin', label: '24. PEN PIN', section: 'C', category: 'Financial', isRestricted: true },
  { key: 'nhfNumber', dbKeyPrivate: 'nhf_number', label: '25. NHF NUMBER', section: 'C', category: 'Financial', isRestricted: true },
  { key: 'assignedUnitId', dbKeyPersonnel: 'unit_id', label: '26. ASSIGNED UNIT / BASE', section: 'D', category: 'Deployment' },
];

export const NPF_RANKS = [
  'PC',
  'Corporal',
  'Sergeant',
  'Inspector',
  'ASP',
  'DSP',
  'SP',
  'CSP',
  'ACP',
  'DCP',
  'CP',
  'AIG',
  'DIG',
  'IGP'
] as const;

export function getRankCategory(rank: string): 'PC_INSPECTOR' | 'ASP_SP' | 'CSP_CP' {
  const r = (rank || '').toUpperCase().trim();
  if (['CSP', 'ACP', 'DCP', 'CP', 'AIG', 'DIG', 'IGP', 'CHIEF SUPERINTENDENT', 'ASSISTANT COMMISSIONER', 'DEPUTY COMMISSIONER', 'COMMISSIONER OF POLICE'].includes(r) || r.includes('CSP') || r.includes('COMMISSIONER') || r.includes('CHIEF SUPERINTENDENT')) {
    return 'CSP_CP';
  }
  if (['ASP', 'ASP I', 'ASP II', 'DSP', 'SP', 'SUPERINTENDENT', 'ASSISTANT SUPERINTENDENT', 'DEPUTY SUPERINTENDENT'].includes(r) || r.includes('ASP') || r.includes('DSP') || r.includes('SUPERINTENDENT')) {
    return 'ASP_SP';
  }
  return 'PC_INSPECTOR';
}

export function getRankCategoryLabel(category: 'PC_INSPECTOR' | 'ASP_SP' | 'CSP_CP'): string {
  switch (category) {
    case 'PC_INSPECTOR':
      return 'POLICE CONSTABLE TO INSPECTOR (PC - INSPECTOR)';
    case 'ASP_SP':
      return 'ASSISTANT SUPERINTENDENT TO SUPERINTENDENT (ASP - SP)';
    case 'CSP_CP':
      return 'CHIEF SUPERINTENDENT TO COMMISSIONER (CSP - CP)';
  }
}
