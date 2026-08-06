'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/layout/Shell';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
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
  Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

interface StateOption {
  id: string;
  name: string;
  code: string;
}

interface UploadRecord {
  id: string;
  stateId: string;
  stateName: string;
  fileName: string;
  storagePath: string;
  totalRecords: number;
  submissionStatus: string;
  reviewComment: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

interface DocumentRecord {
  id: string;
  personnelId: string;
  personnelName: string;
  stateId: string;
  stateName: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
}

export default function StateNominalRollPage() {
  const supabase = createClient();

  const [userRole, setUserRole] = useState<string>('global_admin');
  const [assignedState, setAssignedState] = useState<StateOption | null>(null);
  const [statesList, setStatesList] = useState<StateOption[]>([]);
  const [selectedFilterStateId, setSelectedFilterStateId] = useState<string>('ALL');

  const [uploadsList, setUploadsList] = useState<UploadRecord[]>([]);
  const [documentsList, setDocumentsList] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Bulk Excel Upload State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [uploadingRoll, setUploadingRoll] = useState<boolean>(false);

  // Doc Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('Service Record');
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);

  // Review Modal / Inline Review
  const [activeReviewUpload, setActiveReviewUpload] = useState<UploadRecord | null>(null);
  const [reviewCommentInput, setReviewCommentInput] = useState<string>('');
  const [reviewing, setReviewing] = useState<boolean>(false);

  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchPortalData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Get current user profile & state assignment
      const { data: { user } } = await supabase.auth.getUser();
      let role = 'global_admin';
      let currentAssignedStateId: string | null = null;

      if (user) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role, state_id')
          .eq('user_id', user.id);

        if (userRoles?.[0]) {
          role = userRoles[0].role;
          currentAssignedStateId = userRoles[0].state_id;
        }
        setUserRole(role);
      }

      // 2. Fetch all states
      const { data: stData } = await supabase
        .from('states')
        .select('id, state_name, state_code')
        .order('state_name', { ascending: true });

      if (stData) {
        const mappedStates: StateOption[] = stData.map((s) => ({
          id: s.id,
          name: s.state_name,
          code: s.state_code,
        }));
        setStatesList(mappedStates);

        if (currentAssignedStateId) {
          const match = mappedStates.find((s) => s.id === currentAssignedStateId);
          if (match) setAssignedState(match);
        } else if (mappedStates[0]) {
          // Default for demo if unassigned
          setAssignedState(mappedStates.find((s) => s.code === 'AK') || mappedStates[0]);
        }
      }

      // 3. Fetch nominal roll uploads
      let query = supabase
        .from('nominal_roll_uploads')
        .select(`
          *,
          states (state_name, state_code)
        `)
        .order('created_at', { ascending: false });

      if (role === 'state_admin' && currentAssignedStateId) {
        query = query.eq('state_id', currentAssignedStateId);
      }

      const { data: uData, error: uErr } = await query;
      if (uErr) throw uErr;

      if (uData) {
        const mappedUploads: UploadRecord[] = uData.map((item: any) => ({
          id: item.id,
          stateId: item.state_id,
          stateName: item.states?.state_name || 'STATE',
          fileName: item.file_name,
          storagePath: item.storage_path,
          totalRecords: item.total_records || 0,
          submissionStatus: item.submission_status || 'submitted',
          reviewComment: item.review_comment,
          uploadedBy: item.uploaded_by,
          createdAt: item.created_at,
        }));
        setUploadsList(mappedUploads);
      }

      // 4. Fetch personnel documents
      let docQuery = supabase
        .from('personnel_documents')
        .select(`
          *,
          states (state_name),
          personnel (full_name, apf_no)
        `)
        .order('created_at', { ascending: false });

      if (role === 'state_admin' && currentAssignedStateId) {
        docQuery = docQuery.eq('state_id', currentAssignedStateId);
      }

      const { data: dData } = await docQuery;
      if (dData) {
        const mappedDocs: DocumentRecord[] = dData.map((item: any) => ({
          id: item.id,
          personnelId: item.personnel_id,
          personnelName: item.personnel?.full_name || 'OFFICER',
          stateId: item.state_id,
          stateName: item.states?.state_name || 'STATE',
          documentType: item.document_type || 'Other',
          fileName: item.file_name,
          storagePath: item.storage_path,
          createdAt: item.created_at,
        }));
        setDocumentsList(mappedDocs);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch portal data.';
      console.error('State Nominal Roll fetch exception:', err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // EXCEL PARSING & VALIDATION
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setErrorMsg('');
    setSuccessMsg('');
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          setErrorMsg('Selected Excel file is empty.');
          setParsing(false);
          return;
        }

        // Validate mandatory columns
        const sample = data[0] as any;
        const keys = Object.keys(sample).map((k) => k.toLowerCase().trim());
        const hasServiceNo = keys.some((k) => k.includes('service') || k.includes('ap') || k.includes('f/no'));

        if (!hasServiceNo) {
          setErrorMsg('Upload failed. Excel file must contain a "Service Number" or "AP/F/NO" column.');
          setParsing(false);
          return;
        }

        setParsedRows(data);
        setSuccessMsg(`Excel parsed successfully: ${data.length} personnel records found.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Excel parsing error.';
        setErrorMsg(`Failed to parse Excel file: ${msg}`);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // UPLOAD STATE NOMINAL ROLL
  const handleUploadNominalRoll = async () => {
    if (!excelFile || parsedRows.length === 0) {
      setErrorMsg('Please select a valid Excel file containing nominal roll records.');
      return;
    }

    const stateToUse = assignedState || statesList[0];
    if (!stateToUse) {
      setErrorMsg('State assignment missing.');
      return;
    }

    setUploadingRoll(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const timestamp = Date.now();
      const cleanStateCode = stateToUse.code.toLowerCase();
      const storagePath = `${cleanStateCode}/nominal-roll-${new Date().getFullYear()}-${timestamp}.xlsx`;

      // 1. Upload raw Excel file to private storage bucket (personnel-documents)
      const { error: storageErr } = await supabase.storage
        .from('personnel-documents')
        .upload(storagePath, excelFile, {
          contentType: excelFile.type,
          upsert: true,
        });

      if (storageErr) throw storageErr;

      // 2. Insert record into public.nominal_roll_uploads
      const { data: uploadRecord, error: dbErr } = await supabase
        .from('nominal_roll_uploads')
        .insert({
          state_id: stateToUse.id,
          file_name: excelFile.name,
          storage_path: storagePath,
          total_records: parsedRows.length,
          submission_status: 'submitted',
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // 3. Insert parsed rows into public.personnel
      for (const row of parsedRows) {
        const getVal = (field: string) => {
          const matchKey = Object.keys(row).find((k) => k.toLowerCase().trim().includes(field.toLowerCase()));
          return matchKey ? String(row[matchKey]).trim() : '';
        };

        const apf = getVal('service') || getVal('ap') || getVal('f/no') || `AP/ST-${Date.now()}`;
        const rank = getVal('rank') || 'INSPR';
        const surname = getVal('surname') || getVal('name') || 'OFFICER';
        const firstName = getVal('first') || '';
        const fullName = `${surname} ${firstName}`.trim().toUpperCase();

        const dob = getVal('birth') || getVal('dob') || '1985-01-01';
        const enlist = getVal('enlist') || '2008-01-01';

        await supabase.from('personnel').insert({
          state_id: stateToUse.id,
          apf_no: apf.toUpperCase(),
          service_number: apf.toUpperCase(),
          rank: rank.toUpperCase(),
          full_name: fullName,
          surname: surname.toUpperCase(),
          first_name: firstName.toUpperCase(),
          date_of_birth: dob,
          date_of_enlistment: enlist,
          state_of_origin: stateToUse.name,
          status: 'active',
        });
      }

      // 4. Log Audit Entry
      await supabase.from('audit_logs').insert({
        action: 'NOMINAL_ROLL_UPLOADED',
        entity_type: 'nominal_roll_uploads',
        entity_id: uploadRecord.id,
        actor_role: userRole,
        result: 'SUCCESS',
      });

      setSuccessMsg(`State Nominal Roll for ${stateToUse.name} (${parsedRows.length} Records) uploaded successfully!`);
      setExcelFile(null);
      setParsedRows([]);
      fetchPortalData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      console.error('Nominal roll upload exception:', err);
      setErrorMsg(msg);
    } finally {
      setUploadingRoll(false);
    }
  };

  // REVIEW ACTION BY GLOBAL ADMIN (APPROVE / REJECT / REQUEST CORRECTION)
  const handleReviewSubmission = async (status: 'approved' | 'rejected' | 'correction_requested') => {
    if (!activeReviewUpload) return;

    setReviewing(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('nominal_roll_uploads')
        .update({
          submission_status: status,
          review_comment: reviewCommentInput.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', activeReviewUpload.id);

      if (error) throw error;

      // Log Audit Event
      await supabase.from('audit_logs').insert({
        action: status === 'approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED',
        entity_type: 'nominal_roll_uploads',
        entity_id: activeReviewUpload.id,
        actor_role: 'global_admin',
        result: 'SUCCESS',
      });

      setSuccessMsg(`Submission for ${activeReviewUpload.stateName} updated to "${status.toUpperCase()}".`);
      setActiveReviewUpload(null);
      setReviewCommentInput('');
      fetchPortalData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Review action failed.';
      console.error('Review Exception:', err);
      setErrorMsg(msg);
    } finally {
      setReviewing(false);
    }
  };

  // GENERATE 15-MINUTE SIGNED URL FOR FILE ACCESS
  const handleGenerateSignedUrl = async (storagePath: string, fileName: string) => {
    console.log('Generating 15-minute signed URL for:', storagePath);
    try {
      const { data, error } = await supabase.storage
        .from('personnel-documents')
        .createSignedUrl(storagePath, 900); // 15 minutes = 900s

      if (error || !data?.signedUrl) {
        throw new Error('Document file not found or access denied.');
      }

      window.open(data.signedUrl, '_blank');

      await supabase.from('audit_logs').insert({
        action: 'DOCUMENT_VIEWED',
        entity_type: 'personnel-documents',
        actor_role: userRole,
        result: 'SUCCESS',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate signed URL.';
      setErrorMsg(msg);
    }
  };

  const filteredUploads = uploadsList.filter(
    (u) => selectedFilterStateId === 'ALL' || u.stateId === selectedFilterStateId
  );

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* MODULE HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                STATE NOMINAL ROLL &amp; DOCUMENT MANAGEMENT SYSTEM
              </h1>
              <p className="text-slate-400 mt-1">
                State Personnel Submission • Secure Private Storage • Global Command Review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPortalData}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STATE ADMINISTRATOR ASSIGNED INFORMATION CARD */}
        {userRole === 'state_admin' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">STATE ADMINISTRATOR PORTAL</span>
                <h2 className="text-lg font-black text-white uppercase mt-0.5">
                  ASSIGNED STATE: {assignedState?.name || 'AKWA IBOM'} STATE COMMAND
                </h2>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold uppercase text-[10px]">
                STATE CODE: {assignedState?.code || 'AK'}
              </span>
            </div>

            {/* BULK EXCEL NOMINAL ROLL UPLOADER */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-2">
                <Upload className="w-4 h-4" />
                BULK EXCEL NOMINAL ROLL UPLOAD (.XLSX, .XLS, .CSV)
              </h3>

              <label className="block w-full text-center py-4 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition">
                <FileSpreadsheet className="w-5 h-5 inline-block mr-2 text-cyan-400" />
                <span>{excelFile ? excelFile.name : `Select ${assignedState?.name || 'State'} Nominal Roll Excel File`}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelFileSelect}
                  className="hidden"
                />
              </label>

              {parsedRows.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
                  <span>Validated {parsedRows.length} personnel records for {assignedState?.name}.</span>
                  <button
                    onClick={handleUploadNominalRoll}
                    disabled={uploadingRoll}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition uppercase"
                  >
                    {uploadingRoll ? 'Uploading...' : 'Submit State Roll'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GLOBAL ADMINISTRATOR NATIONAL MONITORING DASHBOARD */}
        {(userRole === 'global_admin' || userRole === 'super_admin') && (
          <div className="space-y-6">
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase">Total Submissions</p>
                  <h3 className="text-2xl font-black text-cyan-400 mt-1">{uploadsList.length}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">36 States &amp; FCT</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase">Approved Rolls</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">
                    {uploadsList.filter((u) => u.submissionStatus === 'approved').length}
                  </h3>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">Active National Master</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase">Pending Review</p>
                  <h3 className="text-2xl font-black text-amber-400 mt-1">
                    {uploadsList.filter((u) => u.submissionStatus === 'submitted').length}
                  </h3>
                  <p className="text-[10px] text-amber-400/80 mt-0.5">Requires Decision</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase">Personnel Documents</p>
                  <h3 className="text-2xl font-black text-indigo-400 mt-1">{documentsList.length}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Private Storage Files</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-bold uppercase text-xs">Filter State:</span>
                <select
                  value={selectedFilterStateId}
                  onChange={(e) => setSelectedFilterStateId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="ALL">All 36 States &amp; FCT</option>
                  {statesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STATE SUBMISSION OVERVIEW TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white uppercase text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              NATIONAL STATE NOMINAL ROLL SUBMISSIONS
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                <tr>
                  <th className="p-3 border-r border-slate-800/60 text-cyan-400">STATE</th>
                  <th className="p-3 border-r border-slate-800/60 text-white">FILE NAME</th>
                  <th className="p-3 border-r border-slate-800/60 text-amber-400">TOTAL RECORDS</th>
                  <th className="p-3 border-r border-slate-800/60">SUBMISSION STATUS</th>
                  <th className="p-3 border-r border-slate-800/60">SUBMITTED AT</th>
                  <th className="p-3 text-cyan-400">COMMAND ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      Loading State Nominal Roll submissions...
                    </td>
                  </tr>
                ) : filteredUploads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      No State Nominal Roll submissions found.
                    </td>
                  </tr>
                ) : (
                  filteredUploads.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 border-r border-slate-800/60 font-bold text-cyan-300">{u.stateName}</td>
                      <td className="p-3 border-r border-slate-800/60 font-bold text-white">{u.fileName}</td>
                      <td className="p-3 border-r border-slate-800/60 font-bold text-amber-400">{u.totalRecords} Records</td>
                      <td className="p-3 border-r border-slate-800/60">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            u.submissionStatus === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : u.submissionStatus === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {u.submissionStatus}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-800/60 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => handleGenerateSignedUrl(u.storagePath, u.fileName)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 hover:text-white transition font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>15m Signed Download</span>
                        </button>

                        {(userRole === 'global_admin' || userRole === 'super_admin') && u.submissionStatus === 'submitted' && (
                          <button
                            onClick={() => {
                              setActiveReviewUpload(u);
                              setReviewCommentInput('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition font-bold text-[11px] inline-flex items-center gap-1 border border-amber-500/40"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Review Submission</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* APPROVAL WORKFLOW REVIEW MODAL */}
        {activeReviewUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white uppercase text-sm">
                  REVIEW SUBMISSION: {activeReviewUpload.stateName} STATE
                </h3>
                <button onClick={() => setActiveReviewUpload(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 text-[11px] block font-bold">REVIEW COMMENTS / FEEDBACK:</span>
                <textarea
                  value={reviewCommentInput}
                  onChange={(e) => setReviewCommentInput(e.target.value)}
                  placeholder="Enter comments or correction instructions..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleReviewSubmission('rejected')}
                  disabled={reviewing}
                  className="px-4 py-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-500/40 hover:bg-rose-900 font-bold uppercase"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleReviewSubmission('approved')}
                  disabled={reviewing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase shadow-lg"
                >
                  Approve Submission
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
