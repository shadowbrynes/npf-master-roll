'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/layout/Shell';
import { FileText, Download, Printer, Shield, Users, Radio, Clock, Award, Building, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CommandReportsPage() {
  const supabase = createClient();
  const [totalPersonnel, setTotalPersonnel] = useState(0);
  const [totalEquipment, setTotalEquipment] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { count: pCount } = await supabase.from('personnel').select('*', { count: 'exact', head: true });
      const { count: eCount } = await supabase.from('equipment_items').select('*', { count: 'exact', head: true });
      const { count: sCount } = await supabase.from('nominal_roll_uploads').select('*', { count: 'exact', head: true });

      setTotalPersonnel(pCount || 0);
      setTotalEquipment(eCount || 0);
      setTotalSubmissions(sCount || 0);
    } catch (err) {
      console.error('Reports fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleGenerateReport = async (reportType: string) => {
    console.log('Generating report:', reportType);
    let dataToExport: any[] = [];
    let fileName = `${reportType}_Report.csv`;

    if (reportType === 'master_roll') {
      const { data } = await supabase.from('personnel').select('apf_no, rank, rank_category, full_name, state_of_origin, duty_post, date_of_enlistment, retirement_date, status');
      dataToExport = data || [];
    } else if (reportType === 'equipment') {
      const { data } = await supabase.from('equipment_items').select('asset_tag, name, serial_number, condition, availability_status, operational_status, custodian_name, custodian_rank, custodian_service_no');
      dataToExport = data || [];
    } else if (reportType === 'state_submissions') {
      const { data } = await supabase.from('nominal_roll_uploads').select('file_name, storage_path, total_records, submission_status, created_at');
      dataToExport = data || [];
    }

    if (dataToExport.length === 0) {
      alert(`No records found for ${reportType} report.`);
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const rows = dataToExport.map((row) => headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                NATIONAL COMMAND REPORT &amp; INTELLIGENCE CENTRE
              </h1>
              <p className="text-slate-400 mt-1">
                Executive Dossier Generation • Printable Audits • Automated CSV Exports
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition flex items-center gap-2 font-bold uppercase border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Executive Briefing</span>
          </button>
        </div>

        {/* REPORT GENERATION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  MASTER PERSONNEL ROLL DOSSIER
                </h3>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 font-bold text-[10px]">
                  {totalPersonnel} RECORDS
                </span>
              </div>
              <p className="text-slate-400 mt-3 text-[11px]">
                Complete National Master Nominal Roll segmented by PC-Inspector, ASP-SP, and CSP-CP officer categories.
              </p>
            </div>

            <button
              onClick={() => handleGenerateReport('master_roll')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold transition flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Export Master Roll CSV</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white uppercase flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  CBRN EQUIPMENT INVENTORY REPORT
                </h3>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 font-bold text-[10px]">
                  {totalEquipment} ASSETS
                </span>
              </div>
              <p className="text-slate-400 mt-3 text-[11px]">
                Tactical equipment inventory, serial numbers, operational readiness, condition status, and custodian tracking.
              </p>
            </div>

            <button
              onClick={() => handleGenerateReport('equipment')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold transition flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Export Equipment CSV</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white uppercase flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  STATE COMMAND SUBMISSIONS REPORT
                </h3>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 font-bold text-[10px]">
                  {totalSubmissions} SUBMISSIONS
                </span>
              </div>
              <p className="text-slate-400 mt-3 text-[11px]">
                Submission history across all 36 States &amp; FCT Command bases, upload dates, total records, and approval status.
              </p>
            </div>

            <button
              onClick={() => handleGenerateReport('state_submissions')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Export State Submissions CSV</span>
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
