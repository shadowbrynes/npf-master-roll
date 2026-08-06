import { describe, it, expect } from 'vitest';
import { calculateStatutoryRetirement } from '../../src/lib/retirement-engine';

describe('Statutory Retirement Calculation Engine (PSR 020810)', () => {
  it('calculates Age 60 rule when DOB produces earlier date than 35 Years Service', () => {
    // DOB: 1966-05-15 (Age 60 -> 2026-05-15)
    // Enlistment: 2000-01-01 (35 Yrs -> 2035-01-01)
    const res = calculateStatutoryRetirement('1966-05-15', '2000-01-01');

    expect(res.ageRetirementDate).toBe('2026-05-15');
    expect(res.serviceRetirementDate).toBe('2035-01-01');
    expect(res.effectiveRetirementDate).toBe('2026-05-15');
    expect(res.basisOfCalculation).toBe('AGE_60');
  });

  it('calculates 35 Years Service rule when Enlistment produces earlier date than Age 60', () => {
    // DOB: 1980-01-01 (Age 60 -> 2040-01-01)
    // Enlistment: 1995-06-01 (35 Yrs -> 2030-06-01)
    const res = calculateStatutoryRetirement('1980-01-01', '1995-06-01');

    expect(res.ageRetirementDate).toBe('2040-01-01');
    expect(res.serviceRetirementDate).toBe('2030-06-01');
    expect(res.effectiveRetirementDate).toBe('2030-06-01');
    expect(res.basisOfCalculation).toBe('SERVICE_35');
  });

  it('applies Global Administrator retirement override date correctly', () => {
    const res = calculateStatutoryRetirement('1980-01-01', '2000-01-01', '2028-12-31');

    expect(res.effectiveRetirementDate).toBe('2028-12-31');
    expect(res.basisOfCalculation).toBe('OVERRIDE');
    expect(res.category).toBe('OVERRIDDEN');
  });
});
