import { z } from 'zod';

export const PersonnelFormSchema = z.object({
  // Section A: Personal and Contact Information
  apfNo: z.string().min(1, 'AP/F/NO is required.').max(30),
  rank: z.string().min(1, 'RANK is required.'),
  fullName: z.string().min(2, 'NAME is required.').max(100),
  educationalQualification: z.string().optional(),
  stateOfOrigin: z.string().min(1, 'STATE OF ORIGIN is required.'),
  phoneNumber: z.string().min(10, 'Valid PHONE NUMBER is required.'),
  tribe: z.string().optional(),
  dateOfBirth: z.string().refine((val) => {
    const dob = new Date(val);
    return !isNaN(dob.getTime()) && dob <= new Date();
  }, 'DATE OF BIRTH cannot be in the future.'),
  geopoliticalZone: z.string().optional(),
  emailAddress: z.string().email('Invalid E-MAIL ADDRESS format.').optional().or(z.literal('')),
  mss: z.string().optional(),

  // Section B: Career, Deployment and Retirement
  dateOfEnlistment: z.string().min(1, 'DATE OF ENLIST is required.').refine((val) => {
    const enlist = new Date(val);
    return !isNaN(enlist.getTime()) && enlist <= new Date();
  }, 'DATE OF ENLIST cannot be in the future.'),
  dateOfLastPromotion: z.string().optional(),
  retirementDate: z.string().optional(),
  commandServedLast: z.string().optional(),
  dutyPost: z.string().optional(),
  dateTransferred: z.string().optional(),
  gdSp: z.string().default('GD'),

  // Section C: Financial, Payroll and Pension (GLOBAL ADMIN RESTRICTED)
  gradeLevel: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  employeeCode: z.string().optional(),
  ippisNumber: z.string().optional(),
  pfa: z.string().optional(),
  penPin: z.string().optional(),
  nhfNumber: z.string().optional(),
  assignedUnitId: z.string().optional(),

  // Section D / Verified Assignment
  baseId: z.string().optional(),
  unitId: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).default('MALE'),
  status: z.enum(['active', 'transferred', 'suspended', 'retired', 'dismissed', 'deceased', 'archived']).default('active'),
}).refine((data) => {
  if (data.dateOfBirth && data.dateOfEnlistment) {
    const dob = new Date(data.dateOfBirth);
    const enlist = new Date(data.dateOfEnlistment);
    return enlist >= dob;
  }
  return true;
}, {
  message: 'DATE OF ENLIST cannot be before DATE OF BIRTH.',
  path: ['dateOfEnlistment'],
});

export type PersonnelFormValues = z.infer<typeof PersonnelFormSchema>;
