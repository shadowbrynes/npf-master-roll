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
