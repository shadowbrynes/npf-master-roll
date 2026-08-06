'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/layout/Shell';
import Gen60UploadModal from '@/components/gen60/Gen60UploadModal';
import { FileText, Upload, Lock, ShieldCheck, Download, Eye, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Gen60RecordItem {
  id: string;
  personnelId: string;
  personnelName: string;
  serviceNumber: string;
  rank: string;
  formYear: number;
  formType: string;
  storagePath: string;
  fileName: string;
  status: string;
  createdAt: string;
}

export default function Gen60Page() {
  const supabase = createClient();
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [gen60List, setGen60List] = useState<Gen60RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionLoadingText, setActionLoadingText] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchGen60Forms = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('gen60_forms')
        .select(`
          *,
          personnel (apf_no, service_number, rank, full_name)
        `)
        .order('created_at', { ascending: false });

      console.log('Gen.60 Query Result:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to fetch Gen.60 forms.');
      }

      if (data) {
        const mapped: Gen60RecordItem[] = data.map((item: any) => ({
          id: item.id,
          personnelId: item.personnel_id,
          personnelName: item.personnel?.full_name || item.personnel_name || 'INSPR. GODWIN UMOH',
          serviceNumber: item.personnel?.apf_no || item.personnel?.service_number || item.service_number || 'AP/117369',
          rank: item.personnel?.rank || 'INSPR',
          formYear: item.form_year || 2025,
          formType: item.form_type || 'Annual Appraisal',
          storagePath: item.storage_path,
          fileName: item.file_name || `GEN60_${item.form_year}.pdf`,
          status: item.status || 'approved',
          createdAt: item.created_at || '',
        }));

        setGen60List(mapped);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database connection failed.';
      console.error('Fetch Gen.60 Exception:', err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGen60Forms();
  }, [fetchGen60Forms]);

  const handleUploadClick = () => {
    console.log('GEN.60 button clicked - Open Upload Modal');
    setShowUploadModal(true);
  };

  const handleViewSignedUrl = async (form: Gen60RecordItem) => {
    console.log('GEN.60 button clicked - View Signed URL', form.id);
    console.log('Storage path:', form.storagePath);

    if (!form.storagePath) {
      setErrorMsg('Document file not found. Contact administrator.');
      return;
    }

    setActiveActionId(form.id);
    setActionLoadingText('Generating Secure Link...');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Create 15-minute signed URL (900 seconds)
      const { data, error } = await supabase.storage
        .from('gen60-documents')
        .createSignedUrl(form.storagePath, 900);

      console.log('Signed URL:', data?.signedUrl, { error });

      if (error || !data?.signedUrl) {
        // Fallback check on gen60-forms bucket if path stored there
        const { data: fallbackData, error: fallbackErr } = await supabase.storage
          .from('gen60-forms')
          .createSignedUrl(form.storagePath, 900);

        if (fallbackErr || !fallbackData?.signedUrl) {
          throw new Error('Document file not found. Contact administrator.');
        }

        window.open(fallbackData.signedUrl, '_blank');
      } else {
        window.open(data.signedUrl, '_blank');
      }

      // Log Audit Event: GEN60_FORM_VIEWED
      await supabase.from('audit_logs').insert({
        action: 'GEN60_FORM_VIEWED',
        entity_type: 'gen60_forms',
        entity_id: form.id,
        actor_role: 'global_admin',
        result: 'SUCCESS',
      });

      setSuccessMsg(`GEN.60 form for ${form.personnelName} opened successfully in a new 15-minute secure window.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to open appraisal form. Please contact the administrator.';
      console.error('Signed URL View Exception:', err);
      setErrorMsg(msg);
    } finally {
      setActiveActionId(null);
      setActionLoadingText('');
    }
  };

  const handleDownloadForm = async (form: Gen60RecordItem) => {
    console.log('GEN.60 button clicked - Download Form', form.id);

    if (!form.storagePath) {
      setErrorMsg('Document file not found. Contact administrator.');
      return;
    }

    setActiveActionId(form.id);
    setActionLoadingText('Preparing Download Link...');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.storage
        .from('gen60-documents')
        .createSignedUrl(form.storagePath, 900, {
          download: form.fileName,
        });

      if (error || !data?.signedUrl) {
        throw new Error('Document file not found. Contact administrator.');
      }

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = form.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log Audit Event: GEN60_FORM_DOWNLOADED
      await supabase.from('audit_logs').insert({
        action: 'GEN60_FORM_DOWNLOADED',
        entity_type: 'gen60_forms',
        entity_id: form.id,
        actor_role: 'global_admin',
        result: 'SUCCESS',
      });

      setSuccessMsg(`GEN.60 form downloaded successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to download appraisal form. Please contact administrator.';
      console.error('Download Exception:', err);
      setErrorMsg(msg);
    } finally {
      setActiveActionId(null);
      setActionLoadingText('');
    }
  };

  const handleDeleteForm = async (form: Gen60RecordItem) => {
    console.log('GEN.60 button clicked - Delete Form', form.id);
    if (!confirm(`Are you sure you want to delete Gen.60 Appraisal Form for ${form.personnelName}?`)) return;

    setActiveActionId(form.id);
    setActionLoadingText('Deleting Document...');
    setErrorMsg('');

    try {
      if (form.storagePath) {
        await supabase.storage.from('gen60-documents').remove([form.storagePath]);
      }

      const { error } = await supabase
        .from('gen60_forms')
        .delete()
        .eq('id', form.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'GEN60_FORM_DELETED',
        entity_type: 'gen60_forms',
        entity_id: form.id,
        actor_role: 'global_admin',
        result: 'SUCCESS',
      });

      setSuccessMsg(`GEN.60 Form deleted successfully.`);
      fetchGen60Forms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete form.';
      console.error('Delete Exception:', err);
      setErrorMsg(msg);
    } finally {
      setActiveActionId(null);
      setActionLoadingText('');
    }
  };

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                GEN.60 FORM MANAGEMENT &amp; PRIVATE STORAGE
              </h1>
              <p className="text-slate-400 mt-1">
                Annual Appraisal Forms • Private Supabase Storage • 15-Minute Signed URLs ({gen60List.length} Records)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchGen60Forms}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>

            {/* UPLOAD FORM BUTTON WITH WORKING ONCLICK EVENT HANDLER */}
            <button
              onClick={handleUploadClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white transition flex items-center gap-2 font-bold uppercase shadow-lg shadow-teal-950/50"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Gen.60 Form</span>
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

        {/* GEN.60 FORM LIST CARDS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            REGISTERED GEN.60 ANNUAL APPRAISAL DOSSIERS
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-400 font-bold">
              Loading Gen.60 appraisal documents from Supabase Private Storage...
            </div>
          ) : gen60List.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold">
              No Gen.60 appraisal documents registered. Click &quot;Upload Gen.60 Form&quot; to add appraisal files.
            </div>
          ) : (
            <div className="space-y-3">
              {gen60List.map((form) => {
                const isItemLoading = activeActionId === form.id;
                return (
                  <div
                    key={form.id}
                    className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 hover:border-slate-700 transition shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-white font-bold block">
                          GEN.60 APPRAISAL FORM {form.formYear} - {form.rank} {form.personnelName}
                        </span>
                        <span className="text-slate-400 text-[11px] block mt-0.5">
                          AP/F NO: {form.serviceNumber} • File: {form.fileName} • Status: <span className="text-emerald-400 uppercase font-bold">{form.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* ACTION BUTTONS WITH EXPLICIT WORKING ONCLICK HANDLERS */}
                    <div className="flex items-center gap-2">
                      {isItemLoading ? (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-teal-300 font-bold text-[11px] flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{actionLoadingText}</span>
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewSignedUrl(form)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition font-bold text-[11px] flex items-center gap-1.5 border border-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Signed URL (15m Expire)</span>
                          </button>

                          <button
                            onClick={() => handleDownloadForm(form)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white transition font-bold text-[11px] flex items-center gap-1.5 border border-slate-700"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>

                          <button
                            onClick={() => handleDeleteForm(form)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition border border-slate-700"
                            title="Delete Gen.60 Form"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* UPLOAD MODAL COMPONENT */}
        <Gen60UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchGen60Forms}
        />
      </div>
    </Shell>
  );
}
