export interface RetirementEngineResult {
  ageRetirementDate: string;
  serviceRetirementDate: string;
  effectiveRetirementDate: string;
  basisOfCalculation: 'AGE_60' | 'SERVICE_35' | 'OVERRIDE';
  daysRemaining: number;
  category: 
    | 'MORE_THAN_12_MONTHS'
    | 'BETWEEN_6_AND_12_MONTHS'
    | 'BETWEEN_3_AND_6_MONTHS'
    | 'DUE_WITHIN_60_DAYS'
    | 'DUE_WITHIN_30_DAYS'
    | 'DUE_WITHIN_7_DAYS'
    | 'DUE_TODAY'
    | 'DATE_PASSED'
    | 'OVERRIDDEN'
    | 'COMPLETED';
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStatutoryRetirement(
  dobStr: string,
  enlistStr: string,
  overrideDateStr?: string
): RetirementEngineResult {
  const [dobYear, dobMonth, dobDay] = dobStr.split('-').map(Number);
  const [enlistYear, enlistMonth, enlistDay] = enlistStr.split('-').map(Number);

  const dob = new Date(dobYear, dobMonth - 1, dobDay);
  const enlist = new Date(enlistYear, enlistMonth - 1, enlistDay);

  const age60 = new Date(dob);
  age60.setFullYear(age60.getFullYear() + 60);

  const service35 = new Date(enlist);
  service35.setFullYear(service35.getFullYear() + 35);

  let effective = age60 < service35 ? age60 : service35;
  let basis: 'AGE_60' | 'SERVICE_35' | 'OVERRIDE' = age60 < service35 ? 'AGE_60' : 'SERVICE_35';

  if (overrideDateStr) {
    const [oYear, oMonth, oDay] = overrideDateStr.split('-').map(Number);
    effective = new Date(oYear, oMonth - 1, oDay);
    basis = 'OVERRIDE';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  effective.setHours(0, 0, 0, 0);

  const diffTime = effective.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let category: RetirementEngineResult['category'];

  if (overrideDateStr) {
    category = 'OVERRIDDEN';
  } else if (daysRemaining > 365) {
    category = 'MORE_THAN_12_MONTHS';
  } else if (daysRemaining >= 180) {
    category = 'BETWEEN_6_AND_12_MONTHS';
  } else if (daysRemaining >= 90) {
    category = 'BETWEEN_3_AND_6_MONTHS';
  } else if (daysRemaining >= 31) {
    category = 'DUE_WITHIN_60_DAYS';
  } else if (daysRemaining >= 8) {
    category = 'DUE_WITHIN_30_DAYS';
  } else if (daysRemaining >= 1) {
    category = 'DUE_WITHIN_7_DAYS';
  } else if (daysRemaining === 0) {
    category = 'DUE_TODAY';
  } else {
    category = 'DATE_PASSED';
  }

  return {
    ageRetirementDate: formatDate(age60),
    serviceRetirementDate: formatDate(service35),
    effectiveRetirementDate: formatDate(effective),
    basisOfCalculation: basis,
    daysRemaining,
    category,
  };
}
