'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Gen60UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PersonnelOption {
  id: string;
  apfNo: string;
  rank: string;
  fullName: string;
}

export default function Gen60UploadModal({ isOpen, onClose, onSuccess }: Gen60UploadModalProps) {
  const supabase = createClient();
  const [personnelList, setPersonnelList] = useState<PersonnelOption[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('');
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formType, setFormType] = useState<string>('ANNUAL_APPRAISAL');
  const [remarks, setRemarks] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [authorized, setAuthorized] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    setSuccessMsg('');
    setErrorMsg('');

    async function loadAuthAndPersonnel() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          const roles = userRoles?.map((r) => r.role) || [];
          const isAllowed =
            roles.includes('global_admin') ||
            roles.includes('state_admin') ||
            roles.includes('unit_admin') ||
            roles.includes('command_admin') ||
            roles.includes('personnel_officer');

          setAuthorized(isAllowed);
        }

        const { data: pData } = await supabase
          .from('personnel')
          .select('id, apf_no, service_number, rank, full_name')
          .order('full_name', { ascending: true });

        if (pData) {
          const mapped: PersonnelOption[] = pData.map((p) => ({
            id: p.id,
            apfNo: p.apf_no || p.service_number || '',
            rank: p.rank || '',
            fullName: p.full_name || '',
          }));

          setPersonnelList(mapped);
          if (mapped[0]) setSelectedPersonnelId(mapped[0].id);
        }
      } catch (err) {
        console.warn('Gen60 modal auth/personnel load error:', err);
      }
    }

    loadAuthAndPersonnel();
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg('Gen.60 form document exceeds maximum allowed size of 15MB.');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMsg('Invalid file format. Allowed formats: PDF, JPEG, PNG.');
      return;
    }

    setErrorMsg('');
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('GEN.60 upload submit clicked');

    if (!authorized) {
      setErrorMsg('You are not authorised to access or upload appraisal documents.');
      return;
    }

    if (!file) {
      setErrorMsg('Please select a Gen.60 appraisal document file.');
      return;
    }

    if (!selectedPersonnelId) {
      setErrorMsg('Please select an officer for this Gen.60 appraisal form.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const selectedOfficer = personnelList.find((p) => p.id === selectedPersonnelId);
      const cleanOfficerName = selectedOfficer ? selectedOfficer.fullName.replace(/[^a-zA-Z0-9]/g, '_') : 'OFFICER';
      const fileExt = file.name.split('.').pop() || 'pdf';
      const storagePath = `2025/${cleanOfficerName}_GEN60_${formYear}_${Date.now()}.${fileExt}`;

      console.log('Uploading Gen.60 to private storage path:', storagePath);

      // 1. Upload to Private Supabase Storage bucket (gen60-documents)
      const { error: storageErr } = await supabase.storage
        .from('gen60-documents')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (storageErr) {
        throw new Error(`Private Storage Upload Failed: ${storageErr.message}`);
      }

      // 2. Insert record into public.gen60_forms
      const { data: g60Record, error: dbErr } = await supabase
        .from('gen60_forms')
        .insert({
          personnel_id: selectedPersonnelId,
          form_year: Number(formYear) || new Date().getFullYear(),
          form_type: formType,
          storage_path: storagePath,
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          remarks: remarks.trim() || null,
          status: 'approved',
        })
        .select()
        .single();

      if (dbErr) {
        throw new Error(`Database Record Insert Failed: ${dbErr.message}`);
      }

      // 3. Log Audit Entry
      await supabase.from('audit_logs').insert({
        action: 'GEN60_FORM_UPLOADED',
        entity_type: 'gen60_forms',
        entity_id: g60Record.id,
        actor_role: 'global_admin',
        result: 'SUCCESS',
      });

      setSuccessMsg(`Gen.60 Appraisal Form (${formYear}) for ${selectedOfficer?.fullName} uploaded successfully!`);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      console.error('Gen.60 Upload Exception:', err);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono text-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-6 p-6">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                UPLOAD GEN.60 APPRAISAL FORM
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Private Supabase Storage • 15-Minute Signed URL Security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!authorized ? (
          <div className="p-6 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>ACCESS DENIED</span>
            </div>
            <p className="text-xs text-rose-200">
              You are not authorised to access this appraisal document. Contact the Global Administrator.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1 font-bold">SELECT POLICE OFFICER: *</label>
              <select
                value={selectedPersonnelId}
                onChange={(e) => setSelectedPersonnelId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Select Officer --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rank} {p.fullName} ({p.apfNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">APPRAISAL YEAR: *</label>
                <input
                  type="number"
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  required
                  min={1990}
                  max={2035}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">FORM TYPE:</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="ANNUAL_APPRAISAL">Annual Appraisal</option>
                  <option value="SPECIAL_APPRAISAL">Special Appraisal</option>
                  <option value="PROMOTION_APPRAISAL">Promotion Appraisal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">GEN.60 DOCUMENT FILE (PDF/JPEG/PNG, Max 15MB): *</label>
              <label className="block w-full text-center py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition">
                <Upload className="w-4 h-4 inline-block mr-2 text-teal-400" />
                <span>{file ? file.name : 'Choose Signed Gen.60 Document'}</span>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">REMARKS / REMARKS BY REVIEWING OFFICER:</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold transition shadow-lg flex items-center gap-2 uppercase tracking-wider"
              >
                <Upload className="w-4 h-4" />
                <span>{submitting ? 'Uploading to Private Storage...' : 'Upload Gen.60 Form'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
