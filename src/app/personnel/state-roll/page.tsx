'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Shell from '@/components/layout/Shell';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  RefreshCw,
  FileText,
  Eye,
  Download,
  Check,
  X,
  MessageSquare,
  Users,
  Search,
  Filter,
  ArrowRight,
  FileCode,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  RotateCw,
  Plus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { StateNominalRollSubmission, CSVSubmissionItem, UserRole } from '@/types';
import * as XLSX from 'xlsx';

// 36 NIGERIAN STATES + FCT ABUJA LIST
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT Abuja'
];

// STATE CODE MAPPER FOR SUBMISSION REFERENCE NUMBERS
const STATE_CODE_MAP: Record<string, string> = {
  'Abia': 'ABI', 'Adamawa': 'ADA', 'Akwa Ibom': 'AKW', 'Anambra': 'ANA', 'Bauchi': 'BAU',
  'Bayelsa': 'BAY', 'Benue': 'BEN', 'Borno': 'BOR', 'Cross River': 'CRO', 'Delta': 'DEL',
  'Ebonyi': 'EBO', 'Edo': 'EDO', 'Ekiti': 'EKI', 'Enugu': 'ENU', 'Gombe': 'GOM',
  'Imo': 'IMO', 'Jigawa': 'JIG', 'Kaduna': 'KAD', 'Kano': 'KAN', 'Katsina': 'KAT',
  'Kebbi': 'KEB', 'Kogi': 'KOG', 'Kwara': 'KWA', 'Lagos': 'LAG', 'Nasarawa': 'NAS',
  'Niger': 'NIG', 'Ogun': 'OGU', 'Ondo': 'OND', 'Osun': 'OSU', 'Oyo': 'OYO',
  'Plateau': 'PLA', 'Rivers': 'RIV', 'Sokoto': 'SOK', 'Taraba': 'TAR', 'Yobe': 'YOB',
  'Zamfara': 'ZAM', 'FCT Abuja': 'FCT'
};

// 26 OFFICIAL HEADINGS IN EXACT SPECIFIED ORDER
const OFFICIAL_26_HEADINGS = [
  'AP/F/NO',
  'RANK',
  'NAME',
  'EDU. QUALIFICATION',
  'STATE OF ORIGIN',
  'PHONE NUMBER',
  'TRIBE',
  'DATE OF BIRTH',
  'GEO POL ZONE',
  'E-MAIL ADDRESS',
  'MSS',
  'DATE OF ENLIST',
  'DATE OF LAST PROM.',
  'DATE OF RETIREMENT',
  'COMMAND SERVED LAST',
  'DUTY POST',
  'DATE TRANSFERRED',
  'GD/SP',
  'G/L',
  'BANK NAME',
  'EMPLOYEE CODE',
  'IPPIS NUMBER',
  'PFA',
  'PEN PIN',
  'NHF NUMBER',
  'ASSIGNED UNIT'
];

// MANDATORY FIELD HEADINGS
const MANDATORY_HEADINGS = [
  'AP/F/NO',
  'RANK',
  'NAME',
  'STATE OF ORIGIN',
  'PHONE NUMBER',
  'DATE OF BIRTH',
  'DATE OF ENLIST',
  'ASSIGNED UNIT'
];

// GEOPOLITICAL ZONE RESOLVER
const resolveGeopoliticalZone = (stateName: string): string => {
  const s = stateName.toLowerCase().trim();
  if (['benue', 'kogi', 'kwara', 'nasarawa', 'niger', 'plateau', 'fct abuja'].some(x => s.includes(x))) return 'North Central';
  if (['adamawa', 'bauchi', 'borno', 'gombe', 'taraba', 'yobe'].some(x => s.includes(x))) return 'North East';
  if (['jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'sokoto', 'zamfara'].some(x => s.includes(x))) return 'North West';
  if (['abia', 'anambra', 'ebonyi', 'enugu', 'imo'].some(x => s.includes(x))) return 'South East';
  if (['akwa ibom', 'bayelsa', 'cross river', 'delta', 'edo', 'rivers'].some(x => s.includes(x))) return 'South South';
  if (['ekiti', 'lagos', 'ogun', 'ondo', 'osun', 'oyo'].some(x => s.includes(x))) return 'South West';
  return 'South South';
};

// MANDATORY AUTOMATIC RETIREMENT CALCULATOR (MIN(DOB + 60 YRS, ENLISTMENT + 35 YRS))
const calculateOfficialRetirementDate = (dobStr: string, enlistStr: string): string => {
  if (!dobStr || !enlistStr) return '';
  const dob = new Date(dobStr);
  const enlist = new Date(enlistStr);

  if (isNaN(dob.getTime()) || isNaN(enlist.getTime())) return '';

  const retAge = new Date(dob);
  retAge.setFullYear(retAge.getFullYear() + 60);

  const retSvc = new Date(enlist);
  retSvc.setFullYear(retSvc.getFullYear() + 35);

  const officialRet = retAge < retSvc ? retAge : retSvc;
  return officialRet.toISOString().split('T')[0];
};

export default function StateNominalRollPage() {
  const supabase = createClient();

  // User & Access States
  const [userRole, setUserRole] = useState<UserRole>('global_admin');
  const [userName, setUserName] = useState<string>('INSPR. GODWIN UMOH');
  
  // Data States
  const [submissions, setSubmissions] = useState<StateNominalRollSubmission[]>([]);
  const [existingMasterPersonnel, setExistingMasterPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterState, setFilterState] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // UI Feedback States
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // CSV Modal Workflow States
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [importStep, setImportStep] = useState<'SELECT' | 'MAP' | 'PREVIEW' | 'SUCCESS'>('SELECT');
  
  // Step 1 & 2: Selection
  const [selectedUploadState, setSelectedUploadState] = useState<string>('Lagos');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  
  // Column Mapping State
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});
  
  // Step 3 & 4: Staged Validated Items
  const [stagedItems, setStagedItems] = useState<CSVSubmissionItem[]>([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState<boolean>(false);

  // Review Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<StateNominalRollSubmission | null>(null);
  const [submissionItems, setSubmissionItems] = useState<CSVSubmissionItem[]>([]);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  // Main Fetch Function
  const fetchPortalData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch User Profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
        if (prof?.full_name) setUserName(prof.full_name);
        if (prof?.role) setUserRole(prof.role as UserRole);
      }

      // 2. Fetch Submissions
      const { data: subData, error: subErr } = await supabase
        .from('personnel_state_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subErr && subErr.code !== '42P01') {
        console.warn('Submissions fetch error:', subErr);
      }

      if (subData) {
        setSubmissions(subData.map((s: any) => ({
          id: s.id,
          referenceNo: s.reference_no,
          stateName: s.state_name,
          stateCode: s.state_code,
          fileName: s.file_name,
          storagePath: s.storage_path,
          submittedBy: s.submitted_by,
          submittedByName: s.submitted_by_name || 'STATE OFFICER',
          totalRecords: s.total_records || 0,
          validRecords: s.valid_records || 0,
          errorRecords: s.error_records || 0,
          duplicateRecords: s.duplicate_records || 0,
          warningRecords: s.warning_records || 0,
          submissionStatus: s.submission_status || 'Uploaded',
          reviewComment: s.review_comment,
          reviewedBy: s.reviewed_by,
          reviewedByName: s.reviewed_by_name,
          reviewedAt: s.reviewed_at,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        })));
      }

      // 3. Fetch Existing Master Personnel for AP/F & IPPIS Duplicate Matching
      const { data: pData } = await supabase
        .from('personnel')
        .select('id, apf_no, full_name, rank, date_of_birth, ippis_number, phone_number, pen_pin, employee_code');
      if (pData) {
        setExistingMasterPersonnel(pData);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch portal data.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // 1. GENERATE DOWNLOADABLE CSV TEMPLATE (EXACT 26 HEADINGS)
  const handleDownloadTemplate = () => {
    const csvContent = OFFICIAL_26_HEADINGS.join(',') + '\n' +
      'AP/117369,INSPR,MUSTAPHA BABANGIDA,B.Sc Computer Science,Lagos,08031234567,Yoruba,1985-04-15,South West,mustapha@npf.gov.ng,MSS-II,2008-08-01,2022-01-15,,Lagos State Command,EOD CBRN Operator,2023-05-10,GD,G/L 09,First Bank of Nigeria,EMP-99201,IPPIS-882103,Stanbic IBTC Pension,PEN-10029384,NHF-449102,Lagos EOD CBRN Base\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'NPF_EOD_CBRN_State_Nominal_Roll_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. PARSE CSV FILE & PREPARE MAPPING / PREVIEW
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsProcessingCsv(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setRawCsvText(text);

        const wb = XLSX.read(text, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('Uploaded CSV file contains no data rows.');
          setIsProcessingCsv(false);
          return;
        }

        const headers = Object.keys(rawJson[0]).map(h => h.trim());
        setDetectedHeaders(headers);

        // Auto-match headers
        const initialMapping: Record<string, string> = {};
        OFFICIAL_26_HEADINGS.forEach(official => {
          const match = headers.find(h => {
            const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanOff = official.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanH === cleanOff || cleanH.includes(cleanOff) || cleanOff.includes(cleanH);
          });
          if (match) initialMapping[official] = match;
        });
        setHeaderMap(initialMapping);

        // Process rows into staged items
        processRowsToStagedItems(rawJson, initialMapping);
        setImportStep('PREVIEW');

      } catch (err: unknown) {
        setErrorMsg('Failed to parse CSV file. Ensure file is formatted in valid UTF-8 CSV.');
      } finally {
        setIsProcessingCsv(false);
      }
    };
    reader.readAsText(file);
  };

  // 3. PROCESS ROWS & PERFORM MANDATORY VALIDATIONS & RETIREMENT COMPUTATION
  const processRowsToStagedItems = (rawJson: any[], mapping: Record<string, string>) => {
    const items: CSVSubmissionItem[] = [];

    rawJson.forEach((row, idx) => {
      const getVal = (officialHeading: string): string => {
        const mappedHeader = mapping[officialHeading];
        if (mappedHeader && row[mappedHeader] !== undefined) {
          return String(row[mappedHeader]).trim();
        }
        // Fallback direct match
        const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === officialHeading.toLowerCase());
        return foundKey ? String(row[foundKey]).trim() : '';
      };

      const apfNo = getVal('AP/F/NO').toUpperCase();
      const rank = getVal('RANK').toUpperCase();
      const name = getVal('NAME').toUpperCase();
      const edu = getVal('EDU. QUALIFICATION');
      const stateOrigin = getVal('STATE OF ORIGIN') || selectedUploadState;
      const phone = getVal('PHONE NUMBER');
      const tribe = getVal('TRIBE');
      const dob = getVal('DATE OF BIRTH');
      const geoZone = getVal('GEO POL ZONE') || resolveGeopoliticalZone(stateOrigin);
      const email = getVal('E-MAIL ADDRESS');
      const mss = getVal('MSS');
      const enlist = getVal('DATE OF ENLIST');
      const lastProm = getVal('DATE OF LAST PROM.');
      const importedRetirement = getVal('DATE OF RETIREMENT');
      const commandLast = getVal('COMMAND SERVED LAST');
      const dutyPost = getVal('DUTY POST');
      const dateTrans = getVal('DATE TRANSFERRED');
      const gdSp = getVal('GD/SP') || 'GD';
      const gradeLevel = getVal('G/L');
      const bankName = getVal('BANK NAME');
      const empCode = getVal('EMPLOYEE CODE');
      const ippis = getVal('IPPIS NUMBER');
      const pfa = getVal('PFA');
      const penPin = getVal('PEN PIN');
      const nhf = getVal('NHF NUMBER');
      const unit = getVal('ASSIGNED UNIT') || `${selectedUploadState} Command`;

      // AUTOMATIC RETIREMENT DATE CALCULATION
      const calcRetirement = calculateOfficialRetirementDate(dob, enlist);

      // VALIDATION CHECKS
      const missingMandatory: string[] = [];
      if (!apfNo) missingMandatory.push('AP/F/NO');
      if (!rank) missingMandatory.push('RANK');
      if (!name) missingMandatory.push('NAME');
      if (!stateOrigin) missingMandatory.push('STATE OF ORIGIN');
      if (!phone) missingMandatory.push('PHONE NUMBER');
      if (!dob) missingMandatory.push('DATE OF BIRTH');
      if (!enlist) missingMandatory.push('DATE OF ENLIST');
      if (!unit) missingMandatory.push('ASSIGNED UNIT');

      let valStatus: 'Valid' | 'Warning' | 'Error' | 'Duplicate' = 'Valid';
      let valNotes: string[] = [];

      if (missingMandatory.length > 0) {
        valStatus = 'Error';
        valNotes.push(`Missing mandatory fields: ${missingMandatory.join(', ')}`);
      }

      // Check AP/F Duplicate in Master Roll or current batch
      const duplicateInMaster = existingMasterPersonnel.find(p => p.apf_no && p.apf_no.toUpperCase() === apfNo);
      const duplicateInBatch = items.find(i => i.apfNo && i.apfNo.toUpperCase() === apfNo);

      if (duplicateInMaster || duplicateInBatch) {
        valStatus = 'Duplicate';
        valNotes.push(`Duplicate AP/F Number #${apfNo} found in database/batch.`);
      }

      // Duplicate match warnings (IPPIS / Name + DOB)
      if (ippis && existingMasterPersonnel.some(p => p.ippis_number === ippis)) {
        if (valStatus !== 'Duplicate' && valStatus !== 'Error') valStatus = 'Warning';
        valNotes.push(`Warning: IPPIS #${ippis} matches existing officer.`);
      }

      // Compare imported vs calculated retirement date
      if (importedRetirement && calcRetirement && importedRetirement !== calcRetirement) {
        if (valStatus === 'Valid') valStatus = 'Warning';
        valNotes.push('Retirement Date Recalculated by System');
      }

      items.push({
        rowNumber: idx + 1,
        apfNo,
        rank,
        name,
        educationalQualification: edu,
        stateOfOrigin: stateOrigin,
        phoneNumber: phone,
        tribe,
        dateOfBirth: dob,
        geopoliticalZone: geoZone,
        emailAddress: email,
        mss,
        dateOfEnlistment: enlist,
        dateOfLastPromotion: lastProm,
        importedDateOfRetirement: importedRetirement,
        calculatedRetirementDate: calcRetirement,
        commandServedLast: commandLast,
        dutyPost,
        dateTransferred: dateTrans,
        gdSp,
        gradeLevel,
        bankName,
        employeeCode: empCode,
        ippisNumber: ippis,
        pfa,
        penPin,
        nhfNumber: nhf,
        assignedUnit: unit,
        validationStatus: valStatus,
        validationNotes: valNotes.join(' | ')
      });
    });

    setStagedItems(items);
  };

  // 4. DOWNLOAD ERROR REPORT CSV
  const handleDownloadErrorReport = () => {
    const errorRows = stagedItems.filter(i => i.validationStatus === 'Error' || i.validationStatus === 'Duplicate');
    if (errorRows.length === 0) return;

    let csv = 'Row Number,AP/F/NO,Officer Name,Validation Status,Error Description,Suggested Correction\n';
    errorRows.forEach(r => {
      csv += `"${r.rowNumber}","${r.apfNo}","${r.name}","${r.validationStatus}","${r.validationNotes}","Ensure mandatory fields are filled and AP/F Number is unique."\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Error_Report_${selectedUploadState}_Nominal_Roll.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. SUBMIT STATE NOMINAL ROLL BATCH & PERSIST TO DATABASE
  const handleConfirmBatchUpload = async () => {
    if (stagedItems.length === 0) return;
    setIsProcessingCsv(true);
    setErrorMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const stateCode = STATE_CODE_MAP[selectedUploadState] || 'ST';
      const refNo = `NPF-EOD-CBRN/${stateCode}/${new Date().getFullYear()}/${String(submissions.length + 1).padStart(4, '0')}`;

      const validCount = stagedItems.filter(i => i.validationStatus === 'Valid').length;
      const warningCount = stagedItems.filter(i => i.validationStatus === 'Warning').length;
      const errorCount = stagedItems.filter(i => i.validationStatus === 'Error').length;
      const duplicateCount = stagedItems.filter(i => i.validationStatus === 'Duplicate').length;

      // 1. Create State Submission Record
      const { data: subRecord, error: subErr } = await supabase
        .from('personnel_state_submissions')
        .insert([{
          reference_no: refNo,
          state_name: selectedUploadState,
          state_code: stateCode,
          file_name: selectedFile?.name || `${selectedUploadState}_State_Nominal_Roll.csv`,
          submitted_by: user?.id || null,
          submitted_by_name: userName,
          total_records: stagedItems.length,
          valid_records: validCount + warningCount,
          error_records: errorCount,
          duplicate_records: duplicateCount,
          warning_records: warningCount,
          submission_status: 'Pending Review'
        }])
        .select()
        .single();

      if (subErr) throw subErr;

      // 2. Create Staged Submission Items
      const submissionItemPayloads = stagedItems.map(item => ({
        submission_id: subRecord.id,
        row_number: item.rowNumber,
        apf_no: item.apfNo,
        rank: item.rank,
        name: item.name,
        educational_qualification: item.educationalQualification,
        state_of_origin: item.stateOfOrigin,
        phone_number: item.phoneNumber,
        tribe: item.tribe,
        date_of_birth: item.dateOfBirth,
        geopolitical_zone: item.geopoliticalZone,
        email_address: item.emailAddress,
        mss: item.mss,
        date_of_enlistment: item.dateOfEnlistment,
        date_of_last_promotion: item.dateOfLastPromotion || null,
        imported_date_of_retirement: item.importedDateOfRetirement || null,
        calculated_retirement_date: item.calculatedRetirementDate,
        command_served_last: item.commandServedLast,
        duty_post: item.dutyPost,
        date_transferred: item.dateTransferred || null,
        gd_sp: item.gdSp,
        grade_level: item.gradeLevel,
        bank_name: item.bankName,
        employee_code: item.employeeCode,
        ippis_number: item.ippisNumber,
        pfa: item.pfa,
        pen_pin: item.penPin,
        nhf_number: item.nhfNumber,
        assigned_unit: item.assignedUnit,
        validation_status: item.validationStatus,
        validation_notes: item.validationNotes
      }));

      const { error: itemsErr } = await supabase.from('personnel_submission_items').insert(submissionItemPayloads);
      if (itemsErr) console.warn('Items insert warning:', itemsErr);

      // Audit Log
      await supabase.from('training_audit_logs').insert([{
        actor_id: user?.id || null,
        actor_name: userName,
        actor_role: userRole,
        action: 'STATE_NOMINAL_ROLL_CSV_SUBMITTED',
        personnel_apf: refNo,
        new_values: { state: selectedUploadState, count: stagedItems.length }
      }]);

      setSuccessMsg(`State Nominal Roll Submission ${refNo} for ${selectedUploadState} created successfully! Pending Command Review.`);
      setImportStep('SUCCESS');
      fetchPortalData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setIsProcessingCsv(false);
    }
  };

  // 6. COMMAND APPROVAL WORKFLOW (INSERTS INTO MASTER NOMINAL ROLL PUBLIC.PERSONNEL)
  const handleReviewSubmissionAction = async (status: 'Approved' | 'Rejected' | 'Returned for Correction') => {
    if (!selectedSubmission) return;
    setIsReviewing(true);
    setErrorMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Update Submission Batch Status
      const { error: updateErr } = await supabase
        .from('personnel_state_submissions')
        .update({
          submission_status: status,
          review_comment: reviewComment,
          reviewed_by: user?.id || null,
          reviewed_by_name: userName,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id);

      if (updateErr) throw updateErr;

      // 2. If Approved, Upsert Valid Personnel into Master Roll Table (public.personnel)
      if (status === 'Approved') {
        const { data: items } = await supabase
          .from('personnel_submission_items')
          .select('*')
          .eq('submission_id', selectedSubmission.id)
          .in('validation_status', ['Valid', 'Warning']);

        if (items && items.length > 0) {
          for (const row of items) {
            await supabase.from('personnel').upsert({
              apf_no: row.apf_no,
              service_number: row.apf_no,
              rank: row.rank,
              full_name: row.name,
              educational_qualification: row.educational_qualification,
              state_of_origin: row.state_of_origin,
              phone_number: row.phone_number,
              tribe: row.tribe,
              date_of_birth: row.date_of_birth,
              geopolitical_zone: row.geopolitical_zone,
              email_address: row.email_address,
              mss: row.mss,
              date_of_enlistment: row.date_of_enlistment,
              date_of_last_promotion: row.date_of_last_promotion,
              date_of_retirement: row.calculated_retirement_date,
              calculated_retirement_date: row.calculated_retirement_date,
              command_served_last: row.command_served_last,
              duty_post: row.duty_post,
              date_transferred_to_command: row.date_transferred,
              gd_sp: row.gd_sp || 'GD',
              grade_level: row.grade_level,
              bank_name: row.bank_name,
              employee_code: row.employee_code,
              ippis_number: row.ippis_number,
              pfa: row.pfa,
              pen_pin: row.pen_pin,
              nhf_number: row.nhf_number,
              assigned_unit: row.assigned_unit,
              status: 'active'
            }, { onConflict: 'apf_no' });
          }
        }
      }

      await supabase.from('training_audit_logs').insert([{
        actor_id: user?.id || null,
        actor_name: userName,
        actor_role: userRole,
        action: `STATE_SUBMISSION_${status.toUpperCase().replace(/\s+/g, '_')}`,
        personnel_apf: selectedSubmission.referenceNo,
        new_values: { comment: reviewComment }
      }]);

      setSuccessMsg(`Submission ${selectedSubmission.referenceNo} set to ${status}. Personnel integrated into Master Roll.`);
      setShowReviewModal(false);
      setSelectedSubmission(null);
      fetchPortalData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Review action failed.');
    } finally {
      setIsReviewing(false);
    }
  };

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchState = filterState === 'ALL' || s.stateName === filterState;
      const matchSearch = searchTerm === '' ||
        s.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.stateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchState && matchSearch;
    });
  }, [submissions, filterState, searchTerm]);

  // Counters
  const totalSubmissionsCount = submissions.length;
  const approvedRollsCount = submissions.filter(s => s.submissionStatus === 'Approved').length;
  const pendingReviewCount = submissions.filter(s => s.submissionStatus === 'Pending Review' || s.submissionStatus === 'Uploaded').length;
  const documentsCount = submissions.filter(s => s.storagePath).length;

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs text-slate-100">
        
        {/* HEADER HERO BANNER WITH DOWNLOAD TEMPLATE & UPLOAD CSV BUTTONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-white uppercase tracking-wider">
                  STATE NOMINAL ROLL &amp; DOCUMENT MANAGEMENT SYSTEM
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  C2 MODULE
                </span>
              </div>
              <p className="text-slate-400 mt-1">
                State Personnel Submission • Secure Private Storage • Global Command Review
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            {/* DOWNLOAD CSV TEMPLATE BUTTON */}
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold cursor-pointer"
            >
              <Download className="w-4 h-4 btn-icon-down" />
              <span>Download CSV Template</span>
            </button>

            {/* PROMINENT ⬆ UPLOAD PERSONNEL CSV BUTTON */}
            <button
              onClick={() => {
                setImportStep('SELECT');
                setSelectedFile(null);
                setStagedItems([]);
                setShowUploadModal(true);
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-xl shadow-cyan-950/60 border border-cyan-400/30 cursor-pointer btn-primary-breathing"
            >
              <Upload className="w-4.5 h-4.5 text-cyan-200 btn-icon-up" />
              <span>⬆ Upload Personnel CSV</span>
            </button>

            <button
              onClick={fetchPortalData}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold cursor-pointer"
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
            <button onClick={() => setErrorMsg('')} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">Total Submissions</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-1">{totalSubmissionsCount}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">36 States &amp; FCT</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">Approved Rolls</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{approvedRollsCount}</h3>
              <p className="text-[10px] text-emerald-400/80 mt-0.5">Active National Master</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">Pending Review</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{pendingReviewCount}</h3>
              <p className="text-[10px] text-amber-400/80 mt-0.5">Requires Decision</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">Personnel Documents</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-1">{documentsCount}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Private Storage Files</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTER TOOLBAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference #, State, or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-bold uppercase">Filter State:</span>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="ALL">All 36 States &amp; FCT</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SUBMISSION HISTORY TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white uppercase text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              STATE NOMINAL ROLL SUBMISSIONS ({filteredSubmissions.length} BATCHES)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                <tr>
                  <th className="p-3 border-r border-slate-800/60 text-cyan-400">REFERENCE NO.</th>
                  <th className="p-3 border-r border-slate-800/60 text-white">STATE / FCT</th>
                  <th className="p-3 border-r border-slate-800/60 text-teal-400">FILE NAME</th>
                  <th className="p-3 border-r border-slate-800/60 text-amber-400">TOTAL PERSONNEL</th>
                  <th className="p-3 border-r border-slate-800/60 text-emerald-400">VALID</th>
                  <th className="p-3 border-r border-slate-800/60 text-rose-400">ERRORS</th>
                  <th className="p-3 border-r border-slate-800/60 text-indigo-300">DUPLICATES</th>
                  <th className="p-3 border-r border-slate-800/60">SUBMITTED BY</th>
                  <th className="p-3 border-r border-slate-800/60">SUBMITTED DATE</th>
                  <th className="p-3 border-r border-slate-800/60 text-center">STATUS</th>
                  <th className="p-3 text-center text-amber-300">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 font-bold">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                      Loading State Nominal Roll submissions...
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 font-bold">
                      No State Nominal Roll submissions found.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((s) => {
                    let badgeClass = 'text-amber-300 bg-amber-950/50 border-amber-500/30';
                    if (s.submissionStatus === 'Approved') badgeClass = 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30';
                    else if (s.submissionStatus === 'Rejected') badgeClass = 'text-rose-400 bg-rose-950/50 border-rose-500/30';
                    else if (s.submissionStatus === 'Returned for Correction') badgeClass = 'text-yellow-300 bg-yellow-950/50 border-yellow-500/30';

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 border-r border-slate-800/60 font-bold text-cyan-300">{s.referenceNo}</td>
                        <td className="p-3 border-r border-slate-800/60 font-bold text-white">{s.stateName}</td>
                        <td className="p-3 border-r border-slate-800/60 font-bold text-teal-300">{s.fileName}</td>
                        <td className="p-3 border-r border-slate-800/60 font-bold text-amber-400">{s.totalRecords}</td>
                        <td className="p-3 border-r border-slate-800/60 text-emerald-400 font-bold">{s.validRecords}</td>
                        <td className="p-3 border-r border-slate-800/60 text-rose-400 font-bold">{s.errorRecords}</td>
                        <td className="p-3 border-r border-slate-800/60 text-indigo-300 font-bold">{s.duplicateRecords}</td>
                        <td className="p-3 border-r border-slate-800/60 text-slate-300">{s.submittedByName}</td>
                        <td className="p-3 border-r border-slate-800/60 text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 border-r border-slate-800/60 text-center">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${badgeClass}`}>
                            {s.submissionStatus}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedSubmission(s);
                              setShowReviewModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px]"
                          >
                            Review / View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: BULK PERSONNEL CSV IMPORT (STEP-BY-STEP WORKFLOW) */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-mono text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 space-y-6 shadow-2xl my-8 relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">BULK PERSONNEL CSV IMPORT</h3>
                    <p className="text-xs text-slate-400">Upload State Nominal Roll Personnel Records (26 Headings)</p>
                  </div>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STEP 1 & 2: SELECT STATE & SELECT CSV FILE */}
              {importStep === 'SELECT' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <label className="block text-cyan-400 font-bold uppercase text-xs">STEP 1: SELECT STATE / FCT *</label>
                      <select
                        value={selectedUploadState}
                        onChange={(e) => setSelectedUploadState(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white font-bold rounded-xl px-3 py-2.5 focus:border-cyan-500 focus:outline-none text-xs"
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500">Records will be assigned to {selectedUploadState} Command batch.</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <label className="block text-teal-400 font-bold uppercase text-xs">DATE FORMAT GUIDANCE</label>
                      <p className="text-slate-300 font-bold">Recommended Date Format: DD/MM/YYYY or YYYY-MM-DD</p>
                      <p className="text-[10px] text-slate-500">System automatically calculates Retirement Date = MIN(DOB + 60 Yrs, Enlistment + 35 Yrs).</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-3xl p-8 text-center space-y-3 transition">
                    <FileSpreadsheet className="w-12 h-12 text-cyan-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase">DROP PERSONNEL CSV HERE OR BROWSE</h4>
                      <p className="text-slate-400 text-xs mt-1">Accepted Format: UTF-8 CSV with 26 Column Headings</p>
                    </div>
                    <input
                      type="file"
                      id="csv-file-input"
                      accept=".csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => document.getElementById('csv-file-input')?.click()}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold transition inline-flex items-center gap-2 uppercase cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Select CSV File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 & 4: CSV PREVIEW & VALIDATION SUMMARY */}
              {importStep === 'PREVIEW' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs text-slate-400 font-bold">STATE: <strong className="text-cyan-300">{selectedUploadState}</strong></span>
                      <span className="text-xs text-slate-400 font-bold ml-4">FILE: <strong className="text-teal-300">{selectedFile?.name}</strong></span>
                    </div>
                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-xl">
                      {stagedItems.length} Total Rows Detected
                    </span>
                  </div>

                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Rows</span>
                      <strong className="text-xl text-white">{stagedItems.length}</strong>
                    </div>
                    <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">Valid</span>
                      <strong className="text-xl text-emerald-400">{stagedItems.filter(i => i.validationStatus === 'Valid').length}</strong>
                    </div>
                    <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-3">
                      <span className="text-[10px] text-amber-400 font-bold uppercase block">Warnings</span>
                      <strong className="text-xl text-amber-400">{stagedItems.filter(i => i.validationStatus === 'Warning').length}</strong>
                    </div>
                    <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-3">
                      <span className="text-[10px] text-rose-400 font-bold uppercase block">Errors / Duplicates</span>
                      <strong className="text-xl text-rose-400">{stagedItems.filter(i => i.validationStatus === 'Error' || i.validationStatus === 'Duplicate').length}</strong>
                    </div>
                  </div>

                  {/* PREVIEW TABLE */}
                  <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-2xl">
                    <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold sticky top-0">
                        <tr>
                          <th className="p-2 border-r border-slate-800 text-cyan-400">ROW</th>
                          <th className="p-2 border-r border-slate-800 text-white">AP/F/NO</th>
                          <th className="p-2 border-r border-slate-800 text-white">OFFICER NAME</th>
                          <th className="p-2 border-r border-slate-800">RANK</th>
                          <th className="p-2 border-r border-slate-800">DOB</th>
                          <th className="p-2 border-r border-slate-800 text-amber-400">CALCULATED RETIREMENT</th>
                          <th className="p-2 border-r border-slate-800">UNIT</th>
                          <th className="p-2 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                        {stagedItems.map((item) => {
                          let badge = 'text-emerald-400 bg-emerald-950/40';
                          if (item.validationStatus === 'Warning') badge = 'text-amber-400 bg-amber-950/40';
                          if (item.validationStatus === 'Error') badge = 'text-rose-400 bg-rose-950/40';
                          if (item.validationStatus === 'Duplicate') badge = 'text-indigo-300 bg-indigo-950/40';

                          return (
                            <tr key={item.rowNumber} className="hover:bg-slate-800/40">
                              <td className="p-2 border-r border-slate-800 text-slate-400">{item.rowNumber}</td>
                              <td className="p-2 border-r border-slate-800 font-bold text-cyan-300">{item.apfNo}</td>
                              <td className="p-2 border-r border-slate-800 font-bold text-white">{item.name}</td>
                              <td className="p-2 border-r border-slate-800">{item.rank}</td>
                              <td className="p-2 border-r border-slate-800 text-slate-400">{item.dateOfBirth}</td>
                              <td className="p-2 border-r border-slate-800 font-bold text-amber-400">{item.calculatedRetirementDate}</td>
                              <td className="p-2 border-r border-slate-800 text-slate-300">{item.assignedUnit}</td>
                              <td className="p-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${badge}`}>
                                  {item.validationStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <button
                      onClick={handleDownloadErrorReport}
                      disabled={stagedItems.filter(i => i.validationStatus === 'Error' || i.validationStatus === 'Duplicate').length === 0}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Error Report</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button onClick={() => setImportStep('SELECT')} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Previous</button>
                      <button
                        onClick={handleConfirmBatchUpload}
                        disabled={isProcessingCsv}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black uppercase tracking-wider shadow-lg cursor-pointer"
                      >
                        {isProcessingCsv ? 'Submitting Batch...' : `Confirm & Submit Batch (${stagedItems.filter(i => i.validationStatus === 'Valid' || i.validationStatus === 'Warning').length} Valid Records)`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: SUCCESS CONFIRMATION */}
              {importStep === 'SUCCESS' && (
                <div className="text-center p-8 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                  <h3 className="text-lg font-black text-white uppercase">PERSONNEL CSV IMPORT SUBMITTED</h3>
                  <p className="text-slate-300 max-w-md mx-auto">
                    State Nominal Roll Batch for <strong>{selectedUploadState}</strong> has been submitted and queued for Command Review.
                  </p>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold uppercase shadow-lg"
                  >
                    View Submissions History
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 2: COMMAND REVIEW & APPROVAL WORKFLOW MODAL */}
        {showReviewModal && selectedSubmission && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white uppercase">REVIEW SUBMISSION: {selectedSubmission.referenceNo}</h3>
                  <p className="text-xs text-slate-400">STATE: {selectedSubmission.stateName} • FILE: {selectedSubmission.fileName}</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Total Personnel</span><strong className="text-sm text-white">{selectedSubmission.totalRecords}</strong></div>
                <div><span className="text-[10px] text-emerald-400 font-bold block uppercase">Valid Records</span><strong className="text-sm text-emerald-400">{selectedSubmission.validRecords}</strong></div>
                <div><span className="text-[10px] text-rose-400 font-bold block uppercase">Errors</span><strong className="text-sm text-rose-400">{selectedSubmission.errorRecords}</strong></div>
                <div><span className="text-[10px] text-indigo-300 font-bold block uppercase">Duplicates</span><strong className="text-sm text-indigo-300">{selectedSubmission.duplicateRecords}</strong></div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400 font-bold mb-1">COMMAND REVIEW COMMENTS &amp; DECISION REASON *</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Enter approval details, correction instructions or rejection reasons..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button onClick={() => setShowReviewModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>

                {userRole === 'global_admin' && (
                  <>
                    <button
                      onClick={() => handleReviewSubmissionAction('Returned for Correction')}
                      disabled={isReviewing}
                      className="px-4 py-2 rounded-xl bg-yellow-950 hover:bg-yellow-900 text-yellow-300 border border-yellow-500/40 font-bold uppercase"
                    >
                      Return for Correction
                    </button>
                    <button
                      onClick={() => handleReviewSubmissionAction('Rejected')}
                      disabled={isReviewing}
                      className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold uppercase"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReviewSubmissionAction('Approved')}
                      disabled={isReviewing}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow-lg cursor-pointer"
                    >
                      {isReviewing ? 'Integrating...' : 'Approve & Integrate to Master Roll'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
