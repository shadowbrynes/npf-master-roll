'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/layout/Shell';
import { Award, Plus, Search, Shield, RefreshCw, AlertTriangle, CheckCircle2, FileText, Calendar, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TrainingRecordItem {
  id: string;
  personnelId: string;
  personnelName: string;
  rank: string;
  apfNo: string;
  courseName: string;
  category: string;
  provider: string;
  completionDate: string;
  expiryDate: string;
  status: string;
  storagePath: string | null;
}

export default function TrainingManagementPage() {
  const supabase = createClient();
  const [trainingsList, setTrainingsList] = useState<TrainingRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAllTrainings = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('personnel_trainings')
        .select(`
          *,
          personnel (full_name, rank, apf_no)
        `)
        .order('completion_date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: TrainingRecordItem[] = data.map((t: any) => ({
          id: t.id,
          personnelId: t.personnel_id,
          personnelName: t.personnel?.full_name || 'OFFICER',
          rank: t.personnel?.rank || 'INSPR',
          apfNo: t.personnel?.apf_no || 'AP/0000',
          courseName: t.course_name,
          category: t.category || 'CBRN',
          provider: t.provider || 'NPF EOD Training School',
          completionDate: t.completion_date || '',
          expiryDate: t.expiry_date || '',
          status: t.status || 'active',
          storagePath: t.certificate_storage_path,
        }));
        setTrainingsList(mapped);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch trainings.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllTrainings();
  }, [fetchAllTrainings]);

  const filteredTrainings = trainingsList.filter((t) => {
    const matchesSearch =
      searchTerm === '' ||
      t.personnelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.apfNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;

    return matchesSearch && matchesCat;
  });

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                CBRN &amp; EOD TRAINING &amp; CERTIFICATION CENTRE
              </h1>
              <p className="text-slate-400 mt-1">
                Specialized Tactical Courses • Expiry Warnings • Personnel Competency Register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllTrainings}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">Total Certifications</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-1">{trainingsList.length}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Verified Records</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">CBRN Specialists</p>
              <h3 className="text-2xl font-black text-teal-400 mt-1">
                {trainingsList.filter((t) => t.category === 'CBRN').length}
              </h3>
              <p className="text-[10px] text-teal-400/80 mt-0.5">Detection &amp; Decon</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">EOD Bomb Technicians</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">
                {trainingsList.filter((t) => t.category === 'EOD' || t.category === 'Bomb Disposal').length}
              </h3>
              <p className="text-[10px] text-amber-400/80 mt-0.5">Explosives Ordnance</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">Hazmat Operators</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-1">
                {trainingsList.filter((t) => t.category === 'Hazmat').length}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Hazardous Materials</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Officer Name, AP/F No, Course Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-bold uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="CBRN">CBRN Detection &amp; Response</option>
              <option value="EOD">EOD Disposal</option>
              <option value="Bomb Disposal">Bomb Disposal</option>
              <option value="Hazmat">Hazmat Response</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
            {errorMsg}
          </div>
        )}

        {/* TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                <tr>
                  <th className="p-3 border-r border-slate-800/60 text-cyan-400">AP/F NO</th>
                  <th className="p-3 border-r border-slate-800/60 text-white">OFFICER NAME</th>
                  <th className="p-3 border-r border-slate-800/60 text-teal-400">COURSE NAME</th>
                  <th className="p-3 border-r border-slate-800/60">CATEGORY</th>
                  <th className="p-3 border-r border-slate-800/60">PROVIDER</th>
                  <th className="p-3 border-r border-slate-800/60">COMPLETED</th>
                  <th className="p-3 border-r border-slate-800/60 text-amber-400">EXPIRY DATE</th>
                  <th className="p-3 text-cyan-400">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                      Loading training records...
                    </td>
                  </tr>
                ) : filteredTrainings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                      No training records found.
                    </td>
                  </tr>
                ) : (
                  filteredTrainings.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 border-r border-slate-800/60 font-bold text-cyan-300">{t.apfNo}</td>
                      <td className="p-3 border-r border-slate-800/60 font-bold text-white">{t.rank} {t.personnelName}</td>
                      <td className="p-3 border-r border-slate-800/60 font-bold text-teal-300">{t.courseName}</td>
                      <td className="p-3 border-r border-slate-800/60 text-slate-300">{t.category}</td>
                      <td className="p-3 border-r border-slate-800/60 text-slate-400">{t.provider}</td>
                      <td className="p-3 border-r border-slate-800/60 text-slate-400">{t.completionDate}</td>
                      <td className="p-3 border-r border-slate-800/60 font-bold text-amber-400">{t.expiryDate || 'PERMANENT'}</td>
                      <td className="p-3 font-bold uppercase text-emerald-400">{t.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
