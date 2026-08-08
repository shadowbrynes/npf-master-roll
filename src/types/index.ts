export type UserRole = 
  | 'global_admin'
  | 'state_admin'
  | 'unit_admin'
  | 'equipment_officer'
  | 'personnel'
  | 'auditor';

export interface UserProfile {
  id: string;
  personnelId?: string;
  email: string;
  fullName: string;
  role: UserRole;
  stateBaseId?: string;
  unitId?: string;
  financialAccessGranted: boolean;
  isMfaEnabled: boolean;
  status: 'active' | 'suspended' | 'deactivated';
}

export interface StateBase {
  id: string;
  commandId?: string;
  baseCode: string;
  baseName: string;
  state: string;
  location: string;
  isFct: boolean;
  status: 'active' | 'inactive';
}

export interface TacticalUnit {
  id: string;
  baseId: string;
  unitCode: string;
  unitName: string;
  unitType: 'TACTICAL' | 'AIRPORT' | 'SEAPORT' | 'FRONTLINE' | 'LABORATORY' | 'HEADQUARTERS';
  status: 'active' | 'inactive';
}

export interface PersonnelMasterRecord {
  id: string;
  // Section A: Personal and Contact Information
  apfNo: string;
  rank: string;
  fullName: string;
  educationalQualification?: string;
  stateOfOrigin: string;
  phoneNumber: string;
  tribe?: string;
  dateOfBirth: string;
  geopoliticalZone?: string;
  emailAddress?: string;
  mss?: string;
  
  // Section B: Career, Deployment and Retirement
  dateOfEnlistment: string;
  dateOfLastPromotion?: string;
  retirementDate: string;
  calculatedRetirementDate: string;
  commandServedLast?: string;
  dutyPost?: string;
  dateTransferredToCommand?: string;
  gdSp: string;

  // Section C: Financial, Payroll and Pension (Decoupled Table)
  gradeLevel?: string;
  bankName?: string;
  accountNumber?: string;
  employeeCode?: string;
  ippisNumber?: string;
  pfa?: string;
  penPin?: string;
  nhfNumber?: string;
  assignedUnitId?: string;

  // Additional Supporting Administrative Fields
  photoUrl?: string;
  gender: 'MALE' | 'FEMALE';
  status: 'active' | 'transferred' | 'suspended' | 'retired' | 'dismissed' | 'deceased' | 'archived';
  baseId?: string;
  unitId?: string;
  currentAppointment?: string;
  datePostedToUnit?: string;
  isArchived: boolean;
  hasRetirementOverride: boolean;
  retirementOverrideReason?: string;
}

export interface Gen60Form {
  id: string;
  personnelId: string;
  formYear: number;
  formType: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'returned_for_correction' | 'superseded' | 'archived';
  storagePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface EquipmentItem {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  serialNumber: string;
  baseId?: string;
  unitId?: string;
  assignedOfficerId?: string;
  condition: 'serviceable' | 'unserviceable' | 'under_repair' | 'damaged' | 'obsolete';
  operationalStatus: 'operational' | 'degraded' | 'non_operational';
  availabilityStatus: 'available' | 'issued' | 'in_use' | 'under_inspection' | 'under_maintenance' | 'awaiting_repair' | 'unserviceable' | 'missing' | 'transferred' | 'retired' | 'disposed';
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  lastCalibrationDate?: string;
  calibrationExpiryDate?: string;
}

export interface AuditLogEntry {
  id: string;
  actorUid?: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  reason?: string;
  result: string;
  createdAt: string;
}

export type VerificationStatus = 'Pending Verification' | 'Verified' | 'Rejected' | 'Requires Review';

export type CertificationStatus = 
  | 'Active' 
  | 'Expiring Soon' 
  | 'Critical Expiry Warning' 
  | 'Expired' 
  | 'Pending Verification' 
  | 'Rejected' 
  | 'Requires Review' 
  | 'No Expiry';

export interface PersonnelCertification {
  id: string;
  personnelId: string;
  courseId?: string;
  categoryId?: string;
  providerId?: string;
  
  apfNo: string;
  officerName: string;
  rank?: string;
  department?: string;
  unit?: string;
  commandLocation?: string;
  phoneNumber?: string;
  officialEmail?: string;
  
  courseName: string;
  category: string;
  provider: string;
  providerCountry?: string;
  providerAddress?: string;
  providerContact?: string;
  accreditationDetails?: string;
  
  certificateNumber?: string;
  courseStartDate?: string;
  courseEndDate?: string;
  completionDate: string;
  certificateIssueDate?: string;
  expiryDate?: string;
  doesNotExpire: boolean;
  
  verificationStatus: VerificationStatus;
  certificationStatus: CertificationStatus;
  
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  verificationComment?: string;
  
  previousCertificationId?: string;
  notes?: string;
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  
  documents?: CertificationDocument[];
  daysRemaining?: number;
}

export interface CertificationDocument {
  id: string;
  certificationId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
  documentCategory: 'Course Certificate' | 'Training Report' | 'Attendance Confirmation' | 'Competency Assessment' | 'Instructor Evaluation' | 'Renewal Certificate' | 'Supporting Document';
  uploadedBy?: string;
  uploadedAt: string;
}

export interface PersonnelCompetency {
  id: string;
  personnelId: string;
  apfNo: string;
  officerName: string;
  rank?: string;
  primaryCompetency?: string;
  secondaryCompetency?: string;
  cbrnQualification?: string;
  eodQualification?: string;
  hazmatQualification?: string;
  detectionQualification?: string;
  decontaminationQualification?: string;
  lastTrainingDate?: string;
  nextExpiryDate?: string;
  competencyStatus: string;
  updatedAt: string;
}

export interface TrainingCourse {
  id: string;
  courseCode: string;
  courseName: string;
  categoryName: string;
  description?: string;
  defaultProviderName?: string;
  validityPeriodMonths: number;
  renewalRequirement?: string;
  competencyAwarded?: string;
  requiredPrerequisite?: string;
  certificationLevel?: string;
  active: boolean;
}

export interface TrainingProvider {
  id: string;
  providerName: string;
  providerType?: string;
  country?: string;
  address?: string;
  email?: string;
  telephone?: string;
  website?: string;
  accreditationDetails?: string;
  active: boolean;
}

export interface StateNominalRollSubmission {
  id: string;
  referenceNo: string;
  stateName: string;
  stateCode: string;
  fileName: string;
  storagePath?: string;
  submittedBy?: string;
  submittedByName?: string;
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  duplicateRecords: number;
  warningRecords: number;
  submissionStatus: 'Uploaded' | 'Validated' | 'Pending Review' | 'Approved' | 'Returned for Correction' | 'Rejected';
  reviewComment?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CSVSubmissionItem {
  id?: string;
  submissionId?: string;
  rowNumber: number;
  apfNo: string;
  rank: string;
  name: string;
  educationalQualification?: string;
  stateOfOrigin: string;
  phoneNumber: string;
  tribe?: string;
  dateOfBirth: string;
  geopoliticalZone?: string;
  emailAddress?: string;
  mss?: string;
  dateOfEnlistment: string;
  dateOfLastPromotion?: string;
  importedDateOfRetirement?: string;
  calculatedRetirementDate: string;
  commandServedLast?: string;
  dutyPost?: string;
  dateTransferred?: string;
  gdSp?: string;
  gradeLevel?: string;
  bankName?: string;
  employeeCode?: string;
  ippisNumber?: string;
  pfa?: string;
  penPin?: string;
  nhfNumber?: string;
  assignedUnit: string;
  validationStatus: 'Valid' | 'Warning' | 'Error' | 'Duplicate';
  validationNotes?: string;
  isDuplicateOverride?: boolean;
  importedPersonnelId?: string;
}


