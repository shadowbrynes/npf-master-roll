'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Shell from '@/components/layout/Shell';
import { 
  Award, 
  Plus, 
  Search, 
  Shield, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Filter, 
  UserCheck, 
  Download, 
  Eye, 
  FileCheck, 
  BookOpen, 
  Building2, 
  History, 
  Upload, 
  X, 
  Clock, 
  FileSpreadsheet, 
  RotateCw, 
  ShieldAlert, 
  Trash2, 
  ExternalLink,
  UserPlus,
  Edit3,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  PersonnelCertification, 
  VerificationStatus, 
  CertificationStatus, 
  TrainingCourse, 
  TrainingProvider, 
  PersonnelCompetency
} from '@/types';
import * as XLSX from 'xlsx';

// 13 Specified Categories
const CATEGORY_OPTIONS = [
  'CBRN',
  'EOD',
  'Hazmat',
  'Detection',
  'Decontamination',
  'Explosives Ordnance',
  'IED',
  'Bomb Disposal',
  'Chemical Response',
  'Biological Response',
  'Radiological Response',
  'Emergency Response',
  'Tactical Training',
  'Other'
];

export default function TrainingManagementPage() {
  const supabase = createClient();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'certifications' | 'competencies' | 'alerts' | 'courses' | 'providers' | 'audit'>('certifications');
  
  // Data States
  const [certifications, setCertifications] = useState<PersonnelCertification[]>([]);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [providers, setProviders] = useState<TrainingProvider[]>([]);
  const [competencies, setCompetencies] = useState<PersonnelCompetency[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  
  // UI & Filter States
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal States
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Selected Record State
  const [selectedCert, setSelectedCert] = useState<PersonnelCertification | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Register / Edit / Renew
  const [formPersonnelQuery, setFormPersonnelQuery] = useState('');
  const [formPersonnelId, setFormPersonnelId] = useState('');
  const [formApfNo, setFormApfNo] = useState('');
  const [formOfficerName, setFormOfficerName] = useState('');
  const [formRank, setFormRank] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formCommand, setFormCommand] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  
  const [formCourseName, setFormCourseName] = useState('');
  const [formCategory, setFormCategory] = useState('CBRN');
  const [formProvider, setFormProvider] = useState('');
  
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formCertNumber, setFormCertNumber] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formDoesNotExpire, setFormDoesNotExpire] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [formFiles, setFormFiles] = useState<{ file: File; category: string }[]>([]);

  // Duplicate Warning Override State
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);

  // Verification Form State
  const [verifyStatus, setVerifyStatus] = useState<VerificationStatus>('Verified');
  const [verifyComment, setVerifyComment] = useState('');

  // Course & Provider Form States
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseName: '',
    categoryName: 'CBRN',
    description: '',
    defaultProviderName: '',
    validityPeriodMonths: 24,
    competencyAwarded: ''
  });

  const [providerForm, setProviderForm] = useState({
    providerName: '',
    providerType: 'Government Agency',
    country: 'Nigeria',
    address: '',
    email: '',
    telephone: '',
    website: '',
    accreditationDetails: ''
  });

  // Calculate status dynamically
  const computeCertificationStatus = useCallback((expiryDateStr?: string, doesNotExpire?: boolean, verificationStatus?: string): CertificationStatus => {
    if (verificationStatus === 'Rejected') return 'Rejected';
    if (verificationStatus === 'Pending Verification') return 'Pending Verification';
    if (doesNotExpire || !expiryDateStr) return 'No Expiry';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays <= 90) return 'Expiring Soon';
    return 'Active';
  }, []);

  const calculateDaysRemaining = useCallback((expiryDateStr?: string, doesNotExpire?: boolean): number | undefined => {
    if (doesNotExpire || !expiryDateStr) return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
  }, []);

  // Main Fetch Function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Certifications
      const { data: certsData, error: certsError } = await supabase
        .from('personnel_certifications')
        .select(`
          *,
          documents:certification_documents(*)
        `)
        .order('created_at', { ascending: false });

      if (certsError && certsError.code !== '42P01') {
        console.warn('Certs fetch error:', certsError);
      }

      if (certsData) {
        const mappedCerts: PersonnelCertification[] = certsData.map((c: any) => {
          const certStatus = computeCertificationStatus(c.expiry_date, c.does_not_expire, c.verification_status);
          const daysRem = calculateDaysRemaining(c.expiry_date, c.does_not_expire);
          return {
            id: c.id,
            personnelId: c.personnel_id,
            apfNo: c.apf_no,
            officerName: c.officer_name,
            rank: c.rank || '',
            department: c.department || '',
            unit: c.unit || '',
            commandLocation: c.command_location || '',
            phoneNumber: c.phone_number || '',
            officialEmail: c.official_email || '',
            courseName: c.course_name,
            category: c.category || 'CBRN',
            provider: c.provider || 'NPF EOD CBRN Training School',
            providerCountry: c.provider_country || 'Nigeria',
            providerAddress: c.provider_address || '',
            providerContact: c.provider_contact || '',
            accreditationDetails: c.accreditation_details || '',
            certificateNumber: c.certificate_number || '',
            courseStartDate: c.course_start_date || '',
            courseEndDate: c.course_end_date || c.completion_date || '',
            completionDate: c.completion_date || '',
            certificateIssueDate: c.certificate_issue_date || c.completion_date || '',
            expiryDate: c.expiry_date || '',
            doesNotExpire: c.does_not_expire || false,
            verificationStatus: c.verification_status || 'Pending Verification',
            certificationStatus: certStatus,
            verifiedBy: c.verified_by,
            verifiedByName: c.verified_by_name || '',
            verifiedAt: c.verified_at || '',
            verificationComment: c.verification_comment || '',
            previousCertificationId: c.previous_certification_id,
            notes: c.notes || '',
            createdBy: c.created_by,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            documents: c.documents ? c.documents.map((d: any) => ({
              id: d.id,
              certificationId: d.certification_id,
              fileName: d.file_name,
              filePath: d.file_path,
              fileType: d.file_type,
              fileSize: d.file_size,
              documentCategory: d.document_category,
              uploadedBy: d.uploaded_by,
              uploadedAt: d.uploaded_at
            })) : [],
            daysRemaining: daysRem
          };
        });
        setCertifications(mappedCerts);
      }

      // 2. Fetch Personnel List
      const { data: pData } = await supabase
        .from('personnel')
        .select(`
          id, apf_no, full_name, rank, duty_post, phone_number, email_address,
          state_bases (base_name), units (unit_name)
        `)
        .order('full_name', { ascending: true });

      if (pData) {
        setPersonnelList(pData);
      }

      // 3. Fetch Courses Catalog
      const { data: crsData } = await supabase
        .from('training_courses')
        .select('*')
        .order('course_name', { ascending: true });
      if (crsData) {
        setCourses(crsData.map((c: any) => ({
          id: c.id,
          courseCode: c.course_code,
          courseName: c.course_name,
          categoryName: c.category_name,
          description: c.description || '',
          defaultProviderName: c.default_provider_name || '',
          validityPeriodMonths: c.validity_period_months || 24,
          renewalRequirement: c.renewal_requirement || '',
          competencyAwarded: c.competency_awarded || '',
          active: c.active
        })));
      }

      // 4. Fetch Providers Directory
      const { data: prvData } = await supabase
        .from('training_providers')
        .select('*')
        .order('provider_name', { ascending: true });
      if (prvData) {
        setProviders(prvData.map((p: any) => ({
          id: p.id,
          providerName: p.provider_name,
          providerType: p.provider_type || '',
          country: p.country || 'Nigeria',
          address: p.address || '',
          email: p.email || '',
          telephone: p.telephone || '',
          website: p.website || '',
          accreditationDetails: p.accreditation_details || '',
          active: p.active
        })));
      }

      // 5. Fetch Competencies
      const { data: compData } = await supabase
        .from('personnel_competencies')
        .select('*')
        .order('officer_name', { ascending: true });
      if (compData) {
        setCompetencies(compData.map((c: any) => ({
          id: c.id,
          personnelId: c.personnel_id,
          apfNo: c.apf_no,
          officerName: c.officer_name,
          rank: c.rank || '',
          primaryCompetency: c.primary_competency || '',
          secondaryCompetency: c.secondary_competency || '',
          cbrnQualification: c.cbrn_qualification || 'Unqualified',
          eodQualification: c.eod_qualification || 'Unqualified',
          hazmatQualification: c.hazmat_qualification || 'Unqualified',
          detectionQualification: c.detection_qualification || 'Unqualified',
          decontaminationQualification: c.decontamination_qualification || 'Unqualified',
          lastTrainingDate: c.last_training_date || '',
          nextExpiryDate: c.next_expiry_date || '',
          competencyStatus: c.competency_status || 'Unqualified',
          updatedAt: c.updated_at
        })));
      }

      // 6. Fetch Audit Logs
      const { data: auditData } = await supabase
        .from('training_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (auditData) {
        setAuditLogs(auditData);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load training data.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase, computeCertificationStatus, calculateDaysRemaining]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Log Audit Action Helper
  const logAudit = async (action: string, certId?: string, apf?: string, prevVals?: any, newVals?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('training_audit_logs').insert([{
        actor_id: user?.id || null,
        actor_name: user?.user_metadata?.full_name || 'SYSTEM ADMIN',
        actor_role: user?.user_metadata?.role || 'global_admin',
        action,
        certification_id: certId || null,
        personnel_apf: apf || null,
        previous_values: prevVals || null,
        new_values: newVals || null
      }]);
    } catch (err) {
      console.warn('Audit log write skipped:', err);
    }
  };

  // Select Personnel from Search
  const handleSelectPersonnel = (p: any) => {
    setFormPersonnelId(p.id);
    setFormApfNo(p.apf_no || '');
    setFormOfficerName(p.full_name || '');
    setFormRank(p.rank || '');
    setFormDepartment(p.duty_post || 'EOD CBRN Command');
    setFormUnit(p.units?.unit_name || 'Tactical Unit');
    setFormCommand(p.state_bases?.base_name || 'National HQ');
    setFormPhone(p.phone_number || '');
    setFormEmail(p.email_address || '');
    setFormPersonnelQuery(`${p.apf_no} - ${p.full_name}`);
  };

  // Select Predefined Course
  const handleCourseSelection = (courseName: string) => {
    setFormCourseName(courseName);
    const matched = courses.find((c) => c.courseName.toLowerCase() === courseName.toLowerCase());
    if (matched) {
      setFormCategory(matched.categoryName);
      if (matched.defaultProviderName) setFormProvider(matched.defaultProviderName);
      if (formCompletionDate && matched.validityPeriodMonths) {
        const d = new Date(formCompletionDate);
        d.setMonth(d.getMonth() + matched.validityPeriodMonths);
        setFormExpiryDate(d.toISOString().split('T')[0]);
      }
    }
  };

  // Handle Course End Date Change (Auto-copy to Completion Date if Completion Date is empty)
  const handleCourseEndDateChange = (val: string) => {
    setFormEndDate(val);
    if (!formCompletionDate || formCompletionDate === formEndDate) {
      setFormCompletionDate(val);
    }
  };

  // Duplicate Check
  const checkDuplicateCert = (certNo: string, currentId?: string) => {
    if (!certNo) return null;
    const matched = certifications.find(
      (c) => c.id !== currentId && c.certificateNumber && c.certificateNumber.trim().toLowerCase() === certNo.trim().toLowerCase()
    );
    if (matched) {
      return `Certificate Number #${certNo} has already been registered for officer ${matched.officerName} (${matched.apfNo}).`;
    }
    return null;
  };

  // Submit Register or Edit Form with Strict Validation
  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // COMPULSORY VALIDATIONS
    if (!formApfNo.trim()) return setErrorMsg('AP/F Number is compulsory.');
    if (!formOfficerName.trim()) return setErrorMsg('Officer Name is compulsory.');
    if (!formCourseName.trim()) return setErrorMsg('Course Name is compulsory.');
    if (!formCategory) return setErrorMsg('Course Category is compulsory.');
    if (!formProvider.trim()) return setErrorMsg('Training Provider is compulsory.');
    if (!formStartDate) return setErrorMsg('Course Start Date is compulsory.');
    if (!formEndDate) return setErrorMsg('Course End Date is compulsory.');
    if (!formCompletionDate) return setErrorMsg('Date Completed is compulsory.');

    if (!formDoesNotExpire && !formExpiryDate) {
      return setErrorMsg('Expiry Date is compulsory unless "Certificate Does Not Expire" is checked.');
    }

    // DATE SEQUENCE VALIDATIONS
    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    const completed = new Date(formCompletionDate);

    if (end < start) {
      return setErrorMsg('Validation Error: Course End Date cannot be earlier than Course Start Date.');
    }
    if (completed < start) {
      return setErrorMsg('Validation Error: Completion Date cannot be earlier than Course Start Date.');
    }
    if (!formDoesNotExpire && formExpiryDate) {
      const expiry = new Date(formExpiryDate);
      if (expiry < completed) {
        return setErrorMsg('Validation Error: Expiry Date cannot be earlier than Completion Date.');
      }
    }

    // DUPLICATE CERTIFICATE NUMBER CHECK
    if (formCertNumber) {
      const dupMsg = checkDuplicateCert(formCertNumber, selectedCert?.id);
      if (dupMsg && !overrideDuplicate) {
        setDuplicateWarning(dupMsg);
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const certPayload = {
        personnel_id: formPersonnelId || null,
        apf_no: formApfNo,
        officer_name: formOfficerName || 'OFFICER',
        rank: formRank || 'INSPR',
        department: formDepartment || 'EOD CBRN Command',
        unit: formUnit || 'Tactical Unit',
        command_location: formCommand || 'National HQ',
        phone_number: formPhone,
        official_email: formEmail,
        course_name: formCourseName,
        category: formCategory,
        provider: formProvider,
        course_start_date: formStartDate,
        course_end_date: formEndDate,
        completion_date: formCompletionDate,
        certificate_issue_date: formIssueDate || formCompletionDate,
        expiry_date: formDoesNotExpire ? null : (formExpiryDate || null),
        does_not_expire: formDoesNotExpire,
        certificate_number: formCertNumber || null,
        verification_status: isEditing ? (selectedCert?.verificationStatus || 'Pending Verification') : 'Pending Verification',
        certification_status: formDoesNotExpire ? 'No Expiry' : computeCertificationStatus(formExpiryDate, formDoesNotExpire, isEditing ? selectedCert?.verificationStatus : 'Pending Verification'),
        notes: formNotes,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString()
      };

      let certId = selectedCert?.id;

      if (isEditing && certId) {
        const { error: updateErr } = await supabase
          .from('personnel_certifications')
          .update(certPayload)
          .eq('id', certId);
        if (updateErr) throw updateErr;
        setSuccessMsg(`Certification record updated successfully.`);
      } else {
        const { data: insertedCert, error: insertError } = await supabase
          .from('personnel_certifications')
          .insert([{
            ...certPayload,
            previous_certification_id: selectedCert ? selectedCert.id : null,
            created_by: user?.id || null
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        certId = insertedCert.id;
        setSuccessMsg(selectedCert ? 'Certification renewed successfully! Created linked historical record.' : 'Certificate registered successfully! Record set to Pending Verification.');
      }

      // Upload Documents
      if (certId && formFiles.length > 0) {
        for (const item of formFiles) {
          const fileExt = item.file.name.split('.').pop();
          const filePath = `certificates/${certId}/${Date.now()}.${fileExt}`;
          
          await supabase.from('certification_documents').insert([{
            certification_id: certId,
            file_name: item.file.name,
            file_path: filePath,
            file_type: item.file.type || 'application/pdf',
            file_size: item.file.size,
            document_category: item.category || 'Course Certificate',
            uploaded_by: user?.id || null
          }]);
        }
      }

      await logAudit(
        isEditing ? 'CERTIFICATION_EDITED' : (selectedCert ? 'CERTIFICATION_RENEWED' : 'CERTIFICATION_REGISTERED'),
        certId,
        formApfNo,
        isEditing ? selectedCert : null,
        certPayload
      );

      setShowRegisterModal(false);
      setSelectedCert(null);
      setIsEditing(false);
      resetRegisterForm();
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMsg(msg);
    }
  };

  // Reset Form
  const resetRegisterForm = () => {
    setFormPersonnelQuery('');
    setFormPersonnelId('');
    setFormApfNo('');
    setFormOfficerName('');
    setFormRank('');
    setFormDepartment('');
    setFormUnit('');
    setFormCommand('');
    setFormPhone('');
    setFormEmail('');
    setFormCourseName('');
    setFormCategory('CBRN');
    setFormProvider('');
    setFormStartDate('');
    setFormEndDate('');
    setFormCompletionDate('');
    setFormIssueDate('');
    setFormCertNumber('');
    setFormExpiryDate('');
    setFormDoesNotExpire(false);
    setFormNotes('');
    setFormFiles([]);
    setDuplicateWarning(null);
    setOverrideDuplicate(false);
    setIsEditing(false);
  };

  // Open Edit Form
  const handleOpenEdit = (cert: PersonnelCertification) => {
    setSelectedCert(cert);
    setIsEditing(true);
    setFormPersonnelId(cert.personnelId);
    setFormApfNo(cert.apfNo);
    setFormOfficerName(cert.officerName);
    setFormRank(cert.rank || '');
    setFormDepartment(cert.department || '');
    setFormUnit(cert.unit || '');
    setFormCommand(cert.commandLocation || '');
    setFormPhone(cert.phoneNumber || '');
    setFormEmail(cert.officialEmail || '');

    setFormCourseName(cert.courseName);
    setFormCategory(cert.category);
    setFormProvider(cert.provider);

    setFormStartDate(cert.courseStartDate || '');
    setFormEndDate(cert.courseEndDate || cert.completionDate || '');
    setFormCompletionDate(cert.completionDate || '');
    setFormIssueDate(cert.certificateIssueDate || '');
    setFormCertNumber(cert.certificateNumber || '');
    setFormExpiryDate(cert.expiryDate || '');
    setFormDoesNotExpire(cert.doesNotExpire);
    setFormNotes(cert.notes || '');

    setShowRegisterModal(true);
  };

  // Open Renewal Form
  const handleOpenRenewal = (cert: PersonnelCertification) => {
    setSelectedCert(cert);
    setIsEditing(false);
    setFormPersonnelId(cert.personnelId);
    setFormApfNo(cert.apfNo);
    setFormOfficerName(cert.officerName);
    setFormRank(cert.rank || '');
    setFormDepartment(cert.department || '');
    setFormUnit(cert.unit || '');
    setFormCommand(cert.commandLocation || '');
    setFormPhone(cert.phoneNumber || '');
    setFormEmail(cert.officialEmail || '');

    setFormCourseName(cert.courseName);
    setFormCategory(cert.category);
    setFormProvider(cert.provider);

    const todayStr = new Date().toISOString().split('T')[0];
    setFormStartDate(todayStr);
    setFormEndDate(todayStr);
    setFormCompletionDate(todayStr);
    setFormIssueDate(todayStr);

    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 2);
    setFormExpiryDate(exp.toISOString().split('T')[0]);
    setFormDoesNotExpire(false);
    setFormNotes(`Renewal of previous certificate #${cert.certificateNumber || cert.id}`);

    setShowRegisterModal(true);
  };

  // Verify Certification Submit
  const handleVerifySubmit = async () => {
    if (!selectedCert) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newCertStatus = computeCertificationStatus(selectedCert.expiryDate, selectedCert.doesNotExpire, verifyStatus);

      const { error } = await supabase
        .from('personnel_certifications')
        .update({
          verification_status: verifyStatus,
          certification_status: newCertStatus,
          verified_by: user?.id || null,
          verified_by_name: user?.user_metadata?.full_name || 'VERIFYING OFFICER',
          verified_at: new Date().toISOString(),
          verification_comment: verifyComment,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCert.id);

      if (error) throw error;

      await logAudit(
        `CERTIFICATION_${verifyStatus.toUpperCase().replace(/\s+/g, '_')}`,
        selectedCert.id,
        selectedCert.apfNo,
        { previousStatus: selectedCert.verificationStatus },
        { newStatus: verifyStatus, comment: verifyComment }
      );

      setSuccessMsg(`Certification status updated to ${verifyStatus}.`);
      setShowVerifyModal(false);
      setSelectedCert(null);
      fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  // Create Course Catalog Entry
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('training_courses').insert([{
        course_code: courseForm.courseCode.toUpperCase(),
        course_name: courseForm.courseName,
        category_name: courseForm.categoryName,
        description: courseForm.description,
        default_provider_name: courseForm.defaultProviderName,
        validity_period_months: courseForm.validityPeriodMonths,
        competency_awarded: courseForm.competencyAwarded
      }]);
      if (error) throw error;
      setSuccessMsg('New Course added to catalog!');
      setShowCourseModal(false);
      fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add course.');
    }
  };

  // Create Provider Entry
  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('training_providers').insert([{
        provider_name: providerForm.providerName,
        provider_type: providerForm.providerType,
        country: providerForm.country,
        address: providerForm.address,
        email: providerForm.email,
        telephone: providerForm.telephone,
        website: providerForm.website,
        accreditation_details: providerForm.accreditationDetails
      }]);
      if (error) throw error;
      setSuccessMsg('New Training Provider registered!');
      setShowProviderModal(false);
      fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add provider.');
    }
  };

  // Export Data
  const handleExport = (type: string, format: 'xlsx' | 'csv') => {
    let exportData: any[] = [];
    let filename = `NPF_EOD_Training_Register_${new Date().toISOString().split('T')[0]}`;

    exportData = filteredCertifications.map((c) => ({
      'AP/F NO': c.apfNo,
      'OFFICER NAME': c.officerName,
      'COURSE NAME': c.courseName,
      'CATEGORY': c.category,
      'PROVIDER': c.provider,
      'START DATE': c.courseStartDate || 'N/A',
      'END DATE': c.courseEndDate || c.completionDate,
      'COMPLETED': c.completionDate,
      'EXPIRY DATE': c.doesNotExpire ? 'NO EXPIRY' : c.expiryDate,
      'STATUS': c.certificationStatus,
      'VERIFICATION': c.verificationStatus,
      'CERTIFICATE NO': c.certificateNumber || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Training Register');
    XLSX.writeFile(wb, `${filename}.${format}`);
  };

  // Filtered Certifications
  const filteredCertifications = useMemo(() => {
    return certifications.filter((c) => {
      const matchesSearch =
        searchTerm === '' ||
        c.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.apfNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.certificateNumber && c.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.provider && c.provider.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
      const matchesVerif = verificationFilter === 'ALL' || c.verificationStatus === verificationFilter;
      const matchesStat = statusFilter === 'ALL' || c.certificationStatus === statusFilter;

      return matchesSearch && matchesCat && matchesVerif && matchesStat;
    });
  }, [certifications, searchTerm, categoryFilter, verificationFilter, statusFilter]);

  // Expiry Alerts List
  const expiryAlerts = useMemo(() => {
    return certifications
      .filter((c) => !c.doesNotExpire && c.expiryDate && (c.certificationStatus === 'Expiring Soon' || c.certificationStatus === 'Expired'))
      .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
  }, [certifications]);

  // Counters
  const totalCerts = certifications.length;
  const verifiedCount = certifications.filter((c) => c.verificationStatus === 'Verified').length;
  const cbrnSpecialists = certifications.filter((c) => c.category === 'CBRN' && c.verificationStatus === 'Verified').length;
  const eodTechnicians = certifications.filter((c) => (c.category === 'EOD' || c.category === 'Bomb Disposal') && c.verificationStatus === 'Verified').length;
  const hazmatOperators = certifications.filter((c) => c.category === 'Hazmat' && c.verificationStatus === 'Verified').length;
  const warningCount = expiryAlerts.length;

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs text-slate-100">
        
        {/* HEADER HERO BANNER WITH PROMINENT + REGISTER CERTIFICATE BUTTON */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white uppercase tracking-wider">
                  CBRN &amp; EOD TRAINING &amp; CERTIFICATION CENTRE
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  C2 MODULE
                </span>
              </div>
              <p className="text-slate-400 mt-1">
                Specialized Tactical Courses • Expiry Warnings • Personnel Competency Register
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            {/* PROMINENT + REGISTER CERTIFICATE BUTTON */}
            <button
              onClick={() => { resetRegisterForm(); setShowRegisterModal(true); }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-xl shadow-cyan-950/60 border border-cyan-400/30 cursor-pointer btn-primary-breathing"
            >
              <Plus className="w-4.5 h-4.5 text-cyan-200" />
              <span>+ Register Certificate</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNERS */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-300 font-bold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SUMMARY COUNTERS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Total Certifications</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-0.5">{totalCerts}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Verified Records</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-0.5">{verifiedCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">CBRN Specialists</p>
              <h3 className="text-2xl font-black text-teal-400 mt-0.5">{cbrnSpecialists}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">EOD Bomb Techs</p>
              <h3 className="text-2xl font-black text-amber-400 mt-0.5">{eodTechnicians}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Hazmat Operators</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-0.5">{hazmatOperators}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Expiry Alerts</p>
              <h3 className="text-2xl font-black text-rose-400 mt-0.5">{warningCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* TAB BAR & EXPORT CONTROLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('certifications')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeTab === 'certifications'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Training Register ({certifications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('competencies')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeTab === 'competencies'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Competency Register</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeTab === 'alerts'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Expiry Warnings ({expiryAlerts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeTab === 'courses'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Course Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('providers')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeTab === 'providers'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Providers Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeTab === 'audit'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('ALL', 'xlsx')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5 font-bold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel Export</span>
            </button>
            <button
              onClick={() => handleExport('ALL', 'csv')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5 font-bold"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MAIN TRAINING REGISTER WITH 12 HEADINGS */}
        {activeTab === 'certifications' && (
          <div className="space-y-4">
            {/* SEARCH AND FILTERS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search AP/F No, Officer Name, Course Title, Certificate #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-400 font-bold uppercase">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase">Verification:</span>
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="ALL">All Verifications</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Requires Review">Requires Review</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="No Expiry">No Expiry</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {(searchTerm || categoryFilter !== 'ALL' || verificationFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); setVerificationFilter('ALL'); setStatusFilter('ALL'); }}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-rose-400 font-bold transition flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* MAIN REGISTER TABLE (12 EXACT COLUMNS SPECIFIED BY USER) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    CBRN &amp; EOD TRAINING REGISTER ({filteredCertifications.length} RECORDS)
                  </h3>
                </div>

                {/* + REGISTER CERTIFICATE BUTTON ABOVE TABLE */}
                <button
                  onClick={() => { resetRegisterForm(); setShowRegisterModal(true); }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg cursor-pointer btn-primary-breathing"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Register Certificate</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3 border-r border-slate-800/60 text-cyan-400">AP/F NO</th>
                      <th className="p-3 border-r border-slate-800/60 text-white">OFFICER NAME</th>
                      <th className="p-3 border-r border-slate-800/60 text-teal-400">COURSE NAME</th>
                      <th className="p-3 border-r border-slate-800/60">CATEGORY</th>
                      <th className="p-3 border-r border-slate-800/60">PROVIDER</th>
                      <th className="p-3 border-r border-slate-800/60 text-indigo-300">START DATE</th>
                      <th className="p-3 border-r border-slate-800/60 text-indigo-300">END DATE</th>
                      <th className="p-3 border-r border-slate-800/60 text-emerald-400">COMPLETED</th>
                      <th className="p-3 border-r border-slate-800/60 text-amber-400">EXPIRY DATE</th>
                      <th className="p-3 border-r border-slate-800/60 text-cyan-300">STATUS</th>
                      <th className="p-3 border-r border-slate-800/60 text-center">CERTIFICATE</th>
                      <th className="p-3 text-center text-amber-300">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="p-12 text-center text-slate-400 font-bold">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                          <span>Loading training &amp; certification records...</span>
                        </td>
                      </tr>
                    ) : filteredCertifications.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-12 text-center text-slate-400 font-bold space-y-3">
                          <Award className="w-12 h-12 text-slate-600 mx-auto" />
                          <p className="text-white text-sm font-bold">No training or certification records have been registered yet.</p>
                          <p className="text-slate-500 max-w-md mx-auto">Register personnel certificates to build the tactical competency roster and track expiry dates.</p>
                          <button
                            onClick={() => { resetRegisterForm(); setShowRegisterModal(true); }}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-black transition inline-flex items-center gap-2 mt-2 uppercase tracking-wider"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ Register First Certificate</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredCertifications.map((c) => {
                        let statusBadgeClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
                        if (c.certificationStatus === 'Expired') statusBadgeClass = 'text-rose-400 bg-rose-950/40 border-rose-500/30';
                        else if (c.certificationStatus === 'Expiring Soon') statusBadgeClass = 'text-amber-400 bg-amber-950/40 border-amber-500/30 animate-pulse';
                        else if (c.certificationStatus === 'Pending Verification') statusBadgeClass = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
                        else if (c.certificationStatus === 'Rejected') statusBadgeClass = 'text-rose-500 bg-rose-950/40 border-rose-500/30';

                        const isMenuOpen = activeActionMenuId === c.id;

                        return (
                          <tr key={c.id} className="hover:bg-slate-800/40 transition relative">
                            <td className="p-3 border-r border-slate-800/60 font-bold text-cyan-300">{c.apfNo}</td>
                            <td className="p-3 border-r border-slate-800/60 font-bold text-white">
                              <div>{c.rank} {c.officerName}</div>
                            </td>
                            <td className="p-3 border-r border-slate-800/60 font-bold text-teal-300">{c.courseName}</td>
                            <td className="p-3 border-r border-slate-800/60 text-slate-300">{c.category}</td>
                            <td className="p-3 border-r border-slate-800/60 text-slate-400 truncate max-w-[140px]">{c.provider}</td>
                            <td className="p-3 border-r border-slate-800/60 text-slate-300 font-mono">{c.courseStartDate || 'N/A'}</td>
                            <td className="p-3 border-r border-slate-800/60 text-slate-300 font-mono">{c.courseEndDate || c.completionDate}</td>
                            <td className="p-3 border-r border-slate-800/60 text-emerald-300 font-mono font-bold">{c.completionDate}</td>
                            <td className="p-3 border-r border-slate-800/60 font-bold text-amber-400 font-mono">
                              {c.doesNotExpire ? 'NO EXPIRY' : c.expiryDate}
                            </td>
                            <td className="p-3 border-r border-slate-800/60 font-bold">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusBadgeClass}`}>
                                {c.certificationStatus}
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-800/60 text-center">
                              {c.documents && c.documents.length > 0 ? (
                                <a
                                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${c.documents[0].filePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-cyan-400 hover:text-white font-bold text-[10px]"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>View Cert</span>
                                </a>
                              ) : (
                                <span className="text-slate-600 text-[10px] font-mono">NO FILE</span>
                              )}
                            </td>

                            {/* ACTIONS MENU COLUMN */}
                            <td className="p-3 text-center relative">
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={() => setActiveActionMenuId(isMenuOpen ? null : c.id)}
                                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1 font-bold"
                                >
                                  <span>Actions</span>
                                  <ChevronDown className="w-3 h-3" />
                                </button>

                                {isMenuOpen && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-40 p-1.5 divide-y divide-slate-800 font-mono text-[11px]">
                                    <div className="py-1">
                                      <button
                                        onClick={() => { setSelectedCert(c); setShowDetailsModal(true); setActiveActionMenuId(null); }}
                                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>View Record</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => { handleOpenEdit(c); setActiveActionMenuId(null); }}
                                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Edit Record</span>
                                      </button>

                                      <button
                                        onClick={() => { setSelectedCert(c); setVerifyStatus(c.verificationStatus); setVerifyComment(c.verificationComment || ''); setShowVerifyModal(true); setActiveActionMenuId(null); }}
                                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                                      >
                                        <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Verify Certificate</span>
                                      </button>

                                      <button
                                        onClick={() => { handleOpenRenewal(c); setActiveActionMenuId(null); }}
                                        className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                                      >
                                        <RotateCw className="w-3.5 h-3.5 text-teal-400" />
                                        <span>Renew Certificate</span>
                                      </button>

                                      {c.documents && c.documents.length > 0 && (
                                        <a
                                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${c.documents[0].filePath}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          download
                                          className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                                        >
                                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>Download Certificate</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPETENCY REGISTER */}
        {activeTab === 'competencies' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase mb-4">OFFICER TACTICAL COMPETENCY REGISTER</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-r border-slate-800 text-cyan-400">AP/F NO</th>
                      <th className="p-3 border-r border-slate-800 text-white">OFFICER NAME</th>
                      <th className="p-3 border-r border-slate-800 text-teal-400">PRIMARY COMPETENCY</th>
                      <th className="p-3 border-r border-slate-800">CBRN QUALIFICATION</th>
                      <th className="p-3 border-r border-slate-800">EOD QUALIFICATION</th>
                      <th className="p-3 border-r border-slate-800">HAZMAT QUALIFICATION</th>
                      <th className="p-3 border-r border-slate-800">LAST TRAINING</th>
                      <th className="p-3 border-r border-slate-800">NEXT EXPIRY</th>
                      <th className="p-3 text-cyan-400">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                    {competencies.length === 0 ? (
                      <tr><td colSpan={9} className="p-8 text-center text-slate-400 font-bold">No officer competencies computed yet.</td></tr>
                    ) : (
                      competencies.map((comp) => (
                        <tr key={comp.id} className="hover:bg-slate-800/40">
                          <td className="p-3 border-r border-slate-800 font-bold text-cyan-300">{comp.apfNo}</td>
                          <td className="p-3 border-r border-slate-800 font-bold text-white">{comp.rank} {comp.officerName}</td>
                          <td className="p-3 border-r border-slate-800 font-bold text-teal-300">{comp.primaryCompetency}</td>
                          <td className="p-3 border-r border-slate-800 text-slate-300">{comp.cbrnQualification}</td>
                          <td className="p-3 border-r border-slate-800 text-slate-300">{comp.eodQualification}</td>
                          <td className="p-3 border-r border-slate-800 text-slate-300">{comp.hazmatQualification}</td>
                          <td className="p-3 border-r border-slate-800 text-slate-400">{comp.lastTrainingDate || 'N/A'}</td>
                          <td className="p-3 border-r border-slate-800 text-slate-400">{comp.nextExpiryDate || 'N/A'}</td>
                          <td className="p-3 font-bold uppercase text-emerald-400">{comp.competencyStatus}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXPIRY WARNINGS */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-rose-400 uppercase mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>IMPENDING CERTIFICATE EXPIRY WARNINGS</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-r border-slate-800 text-rose-400">DAYS REMAINING</th>
                      <th className="p-3 border-r border-slate-800 text-cyan-400">AP/F NO</th>
                      <th className="p-3 border-r border-slate-800 text-white">OFFICER NAME</th>
                      <th className="p-3 border-r border-slate-800 text-teal-400">COURSE NAME</th>
                      <th className="p-3 border-r border-slate-800">CATEGORY</th>
                      <th className="p-3 border-r border-slate-800 text-amber-400">EXPIRY DATE</th>
                      <th className="p-3 border-r border-slate-800">STATUS</th>
                      <th className="p-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                    {expiryAlerts.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-bold">No active certificate expiry warnings.</td></tr>
                    ) : (
                      expiryAlerts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/40">
                          <td className="p-3 border-r border-slate-800 font-black text-amber-400">{c.daysRemaining} DAYS</td>
                          <td className="p-3 border-r border-slate-800 font-bold text-cyan-300">{c.apfNo}</td>
                          <td className="p-3 border-r border-slate-800 font-bold text-white">{c.rank} {c.officerName}</td>
                          <td className="p-3 border-r border-slate-800 font-bold text-teal-300">{c.courseName}</td>
                          <td className="p-3 border-r border-slate-800 text-slate-300">{c.category}</td>
                          <td className="p-3 border-r border-slate-800 font-bold text-amber-400">{c.expiryDate}</td>
                          <td className="p-3 border-r border-slate-800 text-slate-400">{c.certificationStatus}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleOpenRenewal(c)} className="px-3 py-1 bg-teal-600 text-white font-bold rounded-xl">Renew</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COURSES CATALOG */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase">TRAINING COURSES CATALOG</h3>
                <button onClick={() => setShowCourseModal(true)} className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl">+ Add Course</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {courses.map((crs) => (
                  <div key={crs.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                    <div className="flex justify-between text-[10px] text-cyan-400 font-bold"><span>{crs.courseCode}</span><span>{crs.categoryName}</span></div>
                    <h4 className="text-sm font-bold text-white">{crs.courseName}</h4>
                    <p className="text-slate-400 text-[11px]">{crs.description || 'Tactical course'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROVIDERS DIRECTORY */}
        {activeTab === 'providers' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase">TRAINING PROVIDERS DIRECTORY</h3>
                <button onClick={() => setShowProviderModal(true)} className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl">+ Register Provider</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {providers.map((prv) => (
                  <div key={prv.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                    <div className="text-[10px] text-teal-400 font-bold uppercase">{prv.country} • {prv.providerType}</div>
                    <h4 className="text-sm font-bold text-white">{prv.providerName}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase mb-4">TRAINING AUDIT LOG TRAIL</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-r border-slate-800">TIMESTAMP</th>
                      <th className="p-3 border-r border-slate-800">ACTOR</th>
                      <th className="p-3 border-r border-slate-800">ACTION</th>
                      <th className="p-3 border-r border-slate-800">AFFECTED AP/F</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-3 border-r border-slate-800 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3 border-r border-slate-800 font-bold text-white">{log.actor_name}</td>
                        <td className="p-3 border-r border-slate-800 font-bold text-cyan-300">{log.action}</td>
                        <td className="p-3 border-r border-slate-800 text-amber-300">{log.personnel_apf || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: REGISTER / EDIT CERTIFICATE FORM */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 space-y-6 shadow-2xl relative my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">
                      {isEditing ? 'EDIT CERTIFICATE RECORD' : (selectedCert ? 'RENEW CERTIFICATE' : 'REGISTER CERTIFICATE')}
                    </h3>
                    <p className="text-xs text-slate-400">Record personnel course attendance, dates, credentials and certificate files.</p>
                  </div>
                </div>
                <button onClick={() => setShowRegisterModal(false)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DUPLICATE WARNING OVERRIDE BANNER */}
              {duplicateWarning && (
                <div className="p-4 rounded-2xl bg-amber-950/90 border border-amber-500/60 text-amber-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>DUPLICATE CERTIFICATE WARNING</span>
                  </div>
                  <p className="text-xs text-slate-300">{duplicateWarning}</p>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-white pt-2">
                    <input
                      type="checkbox"
                      checked={overrideDuplicate}
                      onChange={(e) => setOverrideDuplicate(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Administrator Override (Proceed saving duplicate certificate number)</span>
                  </label>
                </div>
              )}

              <form onSubmit={handleSubmitRegister} className="space-y-4">
                
                {/* 1 & 2 & 3. PERSONNEL INFORMATION */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>1. PERSONNEL INFORMATION</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">1. AP/F NO *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AP/117369"
                        value={formApfNo}
                        onChange={(e) => {
                          setFormApfNo(e.target.value);
                          const p = personnelList.find(x => x.apf_no?.toLowerCase() === e.target.value.toLowerCase());
                          if (p) handleSelectPersonnel(p);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">2. OFFICER NAME *</label>
                      <input
                        type="text"
                        required
                        value={formOfficerName}
                        onChange={(e) => setFormOfficerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">3. RANK</label>
                      <input
                        type="text"
                        value={formRank}
                        onChange={(e) => setFormRank(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4 & 5 & 6. COURSE, CATEGORY & PROVIDER */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>2. COURSE, CATEGORY &amp; PROVIDER</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">4. COURSE NAME *</label>
                      <input
                        type="text"
                        required
                        list="course-list-options"
                        placeholder="e.g. Advanced CBRN Response"
                        value={formCourseName}
                        onChange={(e) => handleCourseSelection(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                      />
                      <datalist id="course-list-options">
                        {courses.map((c) => (<option key={c.id} value={c.courseName} />))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">5. CATEGORY *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">6. TRAINING PROVIDER *</label>
                      <input
                        type="text"
                        required
                        list="provider-list-options"
                        placeholder="e.g. NPF EOD CBRN Training School"
                        value={formProvider}
                        onChange={(e) => setFormProvider(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                      />
                      <datalist id="provider-list-options">
                        {providers.map((p) => (<option key={p.id} value={p.providerName} />))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* 7 & 8 & 9. DATES SPECIFICATIONS */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>3. COURSE ATTENDANCE &amp; COMPLETION DATES</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">7. DATE COURSE STARTED *</label>
                      <input
                        type="date"
                        required
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">8. DATE COURSE ENDED *</label>
                      <input
                        type="date"
                        required
                        value={formEndDate}
                        onChange={(e) => handleCourseEndDateChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">9. DATE COMPLETED / AWARDED *</label>
                      <input
                        type="date"
                        required
                        value={formCompletionDate}
                        onChange={(e) => setFormCompletionDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 10 & 11 & 12 & 13. CERTIFICATE DETAILS & EXPIRY & UPLOAD */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>4. CREDENTIAL NUMBER, EXPIRY &amp; FILE UPLOAD</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">10. CERTIFICATE NUMBER</label>
                      <input
                        type="text"
                        placeholder="e.g. NPF/EOD/2026/089"
                        value={formCertNumber}
                        onChange={(e) => setFormCertNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">11. CERTIFICATE ISSUE DATE</label>
                      <input
                        type="date"
                        value={formIssueDate}
                        onChange={(e) => setFormIssueDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">12. EXPIRY DATE</label>
                      <input
                        type="date"
                        disabled={formDoesNotExpire}
                        value={formExpiryDate}
                        onChange={(e) => setFormExpiryDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white disabled:opacity-40 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-white">
                      <input
                        type="checkbox"
                        checked={formDoesNotExpire}
                        onChange={(e) => setFormDoesNotExpire(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Certificate Does Not Expire</span>
                    </label>

                    <div>
                      <label className="block text-slate-400 font-bold text-[11px] mb-1">13. UPLOAD CERTIFICATE (PDF, JPG, PNG)</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormFiles([{ file: e.target.files[0], category: 'Course Certificate' }]);
                          }
                        }}
                        className="text-slate-300 text-xs file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                  >
                    Cancel
                  </button>
                  
                  {/* COMPULSORY REGISTER CERTIFICATE SUBMIT BUTTON */}
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
                  >
                    {isEditing ? 'Save Changes' : 'Register Certificate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: VERIFICATION WORKFLOW */}
        {showVerifyModal && selectedCert && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-400" />
                  <span>VERIFY CERTIFICATE</span>
                </h3>
                <button onClick={() => setShowVerifyModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Officer:</span><span className="font-bold text-white">{selectedCert.officerName} ({selectedCert.apfNo})</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Course:</span><span className="font-bold text-teal-300">{selectedCert.courseName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Certificate #:</span><span className="font-mono text-cyan-300">{selectedCert.certificateNumber || 'N/A'}</span></div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">VERIFICATION STATUS ACTION *</label>
                  <select
                    value={verifyStatus}
                    onChange={(e) => setVerifyStatus(e.target.value as VerificationStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Requires Review">Requires Review</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">VERIFICATION COMMENTS</label>
                  <textarea
                    rows={3}
                    placeholder="Enter verification notes..."
                    value={verifyComment}
                    onChange={(e) => setVerifyComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button onClick={() => setShowVerifyModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button onClick={handleVerifySubmit} className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold">Submit Verification</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: VIEW RECORD DOSSIER */}
        {showDetailsModal && selectedCert && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 space-y-6 shadow-2xl relative my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">CERTIFICATE RECORD PROFILE</h3>
                  <p className="text-xs text-slate-400">AP/F NO: {selectedCert.apfNo}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <h4 className="text-cyan-400 font-bold uppercase border-b border-slate-800 pb-1">OFFICER INFORMATION</h4>
                  <p><span className="text-slate-400">AP/F No:</span> <strong className="text-cyan-300">{selectedCert.apfNo}</strong></p>
                  <p><span className="text-slate-400">Name:</span> <strong className="text-white">{selectedCert.rank} {selectedCert.officerName}</strong></p>
                  <p><span className="text-slate-400">Command:</span> {selectedCert.commandLocation}</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <h4 className="text-teal-400 font-bold uppercase border-b border-slate-800 pb-1">COURSE DATES &amp; CREDENTIAL</h4>
                  <p><span className="text-slate-400">Course:</span> <strong className="text-teal-300">{selectedCert.courseName}</strong></p>
                  <p><span className="text-slate-400">Start Date:</span> {selectedCert.courseStartDate || 'N/A'}</p>
                  <p><span className="text-slate-400">End Date:</span> {selectedCert.courseEndDate || selectedCert.completionDate}</p>
                  <p><span className="text-slate-400">Completion Date:</span> {selectedCert.completionDate}</p>
                  <p><span className="text-slate-400">Expiry Date:</span> {selectedCert.doesNotExpire ? 'NO EXPIRY' : selectedCert.expiryDate}</p>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-800 pt-3">
                <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Close Profile</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
