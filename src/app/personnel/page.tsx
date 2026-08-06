'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/layout/Shell';
import { Users, Search, Download, Shield, Eye, RefreshCw, ChevronDown, ChevronUp, Printer, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getRankCategory, getRankCategoryLabel } from '@/lib/personnel-fields';
import Link from 'next/link';

interface MasterRollRecord {
  id: string;
  apfNo: string;
  rank: string;
  rankCategory: 'PC_INSPECTOR' | 'ASP_SP' | 'CSP_CP';
  fullName: string;
  educationalQualification: string;
  stateOfOrigin: string;
  phoneNumber: string;
  tribe: string;
  dateOfBirth: string;
  geopoliticalZone: string;
  emailAddress: string;
  mss: string;

  dateOfEnlistment: string;
  dateOfLastPromotion: string;
  retirementDate: string;
  commandServedLast: string;
  dutyPost: string;
  dateTransferred: string;
  gdSp: string;

  gradeLevel: string;
  bankName: string;
  employeeCode: string;
  ippisNumber: string;
  pfa: string;
  penPin: string;
  nhfNumber: string;
  assignedUnit: string;
  status: string;
  createdAt: string;
}

export default function PersonnelPage() {
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRankCategoryFilter, setSelectedRankCategoryFilter] = useState<'ALL' | 'PC_INSPECTOR' | 'ASP_SP' | 'CSP_CP'>('ALL');
  const [personnelList, setPersonnelList] = useState<MasterRollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Segment Expansion Controls
  const [expandedSegments, setExpandedSegments] = useState({
    PC_INSPECTOR: true,
    ASP_SP: true,
    CSP_CP: true,
  });

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('personnel')
        .select(`
          *,
          personnel_private (*)
        `)
        .order('created_at', { ascending: false });

      console.log('Master Roll Query Result:', { count: data?.length, error });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const mapped: MasterRollRecord[] = data.map((item: any) => {
          const priv = Array.isArray(item.personnel_private) ? item.personnel_private[0] : item.personnel_private;
          const calculatedCategory = item.rank_category || getRankCategory(item.rank);

          return {
            id: item.id,
            apfNo: item.apf_no || item.service_number || '',
            rank: item.rank || 'UNSPECIFIED',
            rankCategory: calculatedCategory,
            fullName: item.full_name || `${item.surname || ''} ${item.first_name || ''}`.trim() || 'UNNAMED OFFICER',
            educationalQualification: item.educational_qualification || '',
            stateOfOrigin: item.state_of_origin || '',
            phoneNumber: priv?.phone_number || '',
            tribe: item.tribe || '',
            dateOfBirth: item.date_of_birth || '',
            geopoliticalZone: item.geopolitical_zone || item.geo_pol_zone || '',
            emailAddress: priv?.email_address || '',
            mss: priv?.mss || '',

            dateOfEnlistment: item.date_of_enlistment || item.enlist_date || '',
            dateOfLastPromotion: item.date_of_last_promotion || item.last_prom_date || '',
            retirementDate: item.retirement_date || item.calculated_retirement_date || '',
            commandServedLast: item.command_served_last || '',
            dutyPost: item.duty_post || 'TACTICAL OFFICER',
            dateTransferred: item.date_transferred_to_command || item.transferred_date || '',
            gdSp: item.gd_sp || 'GD',

            gradeLevel: item.grade_level || item.gl || '',
            bankName: priv?.bank_name || '',
            employeeCode: item.employee_code || '',
            ippisNumber: priv?.ippis_number || '',
            pfa: priv?.pfa || '',
            penPin: priv?.pen_pin || '',
            nhfNumber: priv?.nhf_number || '',
            assignedUnit: item.unit_id || 'EOD COMMAND BASE',
            status: item.status || 'active',
            createdAt: item.created_at || '',
          };
        });

        setPersonnelList(mapped);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch personnel records.';
      console.error('Master Roll Query Exception:', err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  // Filtered lists
  const filteredList = personnelList.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.apfNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.stateOfOrigin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dutyPost.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedRankCategoryFilter === 'ALL' || p.rankCategory === selectedRankCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const pcInspectorList = filteredList.filter((p) => p.rankCategory === 'PC_INSPECTOR');
  const aspSpList = filteredList.filter((p) => p.rankCategory === 'ASP_SP');
  const cspCpList = filteredList.filter((p) => p.rankCategory === 'CSP_CP');

  const toggleSegment = (category: 'PC_INSPECTOR' | 'ASP_SP' | 'CSP_CP') => {
    setExpandedSegments((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const exportSegmentToCSV = (categoryName: string, records: MasterRollRecord[]) => {
    if (records.length === 0) return;
    const headers = ['AP/F/NO', 'RANK', 'NAME', 'STATE OF ORIGIN', 'DUTY POST', 'DATE OF ENLISTMENT', 'RETIREMENT DATE', 'STATUS'];
    const rows = records.map((r) => [
      r.apfNo,
      r.rank,
      `"${r.fullName}"`,
      r.stateOfOrigin,
      `"${r.dutyPost}"`,
      r.dateOfEnlistment,
      r.retirementDate,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${categoryName.replace(/[^a-z0-9]/gi, '_')}_Roll.csv`);
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
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                SEGMENTED NATIONAL MASTER NOMINAL ROLL
              </h1>
              <p className="text-slate-400 mt-1">
                Command Hierarchy Separation • Total Active Roster: {personnelList.length} Personnel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportSegmentToCSV('Complete_National_Master', filteredList)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition flex items-center gap-2 font-bold uppercase border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Export Master Roll</span>
            </button>

            <button
              onClick={fetchPersonnel}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS BY RANK CATEGORY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">TOTAL PERSONNEL</p>
              <h3 className="text-2xl font-black text-white mt-1">{personnelList.length}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">National C2 Register</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">PC - INSPECTOR</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">
                {personnelList.filter((p) => p.rankCategory === 'PC_INSPECTOR').length}
              </h3>
              <p className="text-[10px] text-emerald-400/80 mt-0.5">Inspectorate &amp; Rank &amp; File</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">ASP - SP</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">
                {personnelList.filter((p) => p.rankCategory === 'ASP_SP').length}
              </h3>
              <p className="text-[10px] text-amber-400/80 mt-0.5">Superintendent Cadre</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">CSP - CP</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-1">
                {personnelList.filter((p) => p.rankCategory === 'CSP_CP').length}
              </h3>
              <p className="text-[10px] text-indigo-400/80 mt-0.5">Command &amp; Senior Officer</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER TOOLBAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by AP/F No, Officer Name, Rank, State of Origin, Duty Post..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-bold uppercase text-xs">Filter Category:</span>
            <select
              value={selectedRankCategoryFilter}
              onChange={(e) => setSelectedRankCategoryFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none font-bold"
            >
              <option value="ALL">All Categories</option>
              <option value="PC_INSPECTOR">PC - INSPECTOR (Police Constable to Inspector)</option>
              <option value="ASP_SP">ASP - SP (Assistant Superintendent to Superintendent)</option>
              <option value="CSP_CP">CSP - CP (Chief Superintendent to Commissioner)</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
            {errorMsg}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEGMENT 1: POLICE CONSTABLE TO INSPECTOR (PC - INSPECTOR) */}
        {/* ========================================================================= */}
        {(selectedRankCategoryFilter === 'ALL' || selectedRankCategoryFilter === 'PC_INSPECTOR') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSegment('PC_INSPECTOR')}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {expandedSegments.PC_INSPECTOR ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div>
                  <h2 className="font-bold text-emerald-400 uppercase text-xs flex items-center gap-2">
                    SECTION 1: POLICE CONSTABLE TO INSPECTOR (PC - INSPECTOR)
                  </h2>
                  <span className="text-slate-400 text-[11px]">
                    Total Personnel: <strong className="text-white">{pcInspectorList.length}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => exportSegmentToCSV('PC_INSPECTOR_Roll', pcInspectorList)}
                disabled={pcInspectorList.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 transition font-bold text-[11px] flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PC - Inspector Roll</span>
              </button>
            </div>

            {expandedSegments.PC_INSPECTOR && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-r border-slate-800/60 text-cyan-400">AP/F/NO</th>
                      <th className="p-3 border-r border-slate-800/60 text-emerald-400">RANK</th>
                      <th className="p-3 border-r border-slate-800/60 text-white">OFFICER NAME</th>
                      <th className="p-3 border-r border-slate-800/60">STATE OF ORIGIN</th>
                      <th className="p-3 border-r border-slate-800/60">DUTY POST</th>
                      <th className="p-3 border-r border-slate-800/60">DATE OF ENLISTMENT</th>
                      <th className="p-3 border-r border-slate-800/60 text-amber-400">RETIREMENT DATE</th>
                      <th className="p-3 text-cyan-400">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          Loading Constable to Inspector records...
                        </td>
                      </tr>
                    ) : pcInspectorList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          No personnel found under Police Constable to Inspector category.
                        </td>
                      </tr>
                    ) : (
                      pcInspectorList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 border-r border-slate-800/60 font-bold text-cyan-300">{p.apfNo}</td>
                          <td className="p-3 border-r border-slate-800/60 font-bold text-emerald-400">{p.rank}</td>
                          <td className="p-3 border-r border-slate-800/60 font-bold text-white">
                            <Link href={`/personnel/${p.id}`} className="hover:text-cyan-400 underline decoration-dashed transition">
                              {p.fullName}
                            </Link>
                          </td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.stateOfOrigin}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.dutyPost}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateOfEnlistment}</td>
                          <td className="p-3 border-r border-slate-800/60 text-amber-400 font-bold">{p.retirementDate}</td>
                          <td className="p-3 font-bold uppercase text-emerald-400">{p.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEGMENT 2: ASSISTANT SUPERINTENDENT TO SUPERINTENDENT (ASP - SP) */}
        {/* ========================================================================= */}
        {(selectedRankCategoryFilter === 'ALL' || selectedRankCategoryFilter === 'ASP_SP') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSegment('ASP_SP')}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {expandedSegments.ASP_SP ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div>
                  <h2 className="font-bold text-amber-400 uppercase text-xs flex items-center gap-2">
                    SECTION 2: ASSISTANT SUPERINTENDENT TO SUPERINTENDENT (ASP - SP)
                  </h2>
                  <span className="text-slate-400 text-[11px]">
                    Total Personnel: <strong className="text-white">{aspSpList.length}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => exportSegmentToCSV('ASP_SP_Roll', aspSpList)}
                disabled={aspSpList.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition font-bold text-[11px] flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ASP - SP Roll</span>
              </button>
            </div>

            {expandedSegments.ASP_SP && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-r border-slate-800/60 text-cyan-400">AP/F/NO</th>
                      <th className="p-3 border-r border-slate-800/60 text-amber-400">RANK</th>
                      <th className="p-3 border-r border-slate-800/60 text-white">OFFICER NAME</th>
                      <th className="p-3 border-r border-slate-800/60">STATE OF ORIGIN</th>
                      <th className="p-3 border-r border-slate-800/60">DUTY POST</th>
                      <th className="p-3 border-r border-slate-800/60">DATE OF ENLISTMENT</th>
                      <th className="p-3 border-r border-slate-800/60 text-amber-400">RETIREMENT DATE</th>
                      <th className="p-3 text-cyan-400">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          Loading ASP to SP records...
                        </td>
                      </tr>
                    ) : aspSpList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          No personnel found under ASP to SP category.
                        </td>
                      </tr>
                    ) : (
                      aspSpList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 border-r border-slate-800/60 font-bold text-cyan-300">{p.apfNo}</td>
                          <td className="p-3 border-r border-slate-800/60 font-bold text-amber-400">{p.rank}</td>
                          <td className="p-3 border-r border-slate-800/60 font-bold text-white">
                            <Link href={`/personnel/${p.id}`} className="hover:text-cyan-400 underline decoration-dashed transition">
                              {p.fullName}
                            </Link>
                          </td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.stateOfOrigin}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.dutyPost}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateOfEnlistment}</td>
                          <td className="p-3 border-r border-slate-800/60 text-amber-400 font-bold">{p.retirementDate}</td>
                          <td className="p-3 font-bold uppercase text-emerald-400">{p.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEGMENT 3: CHIEF SUPERINTENDENT TO COMMISSIONER (CSP - CP) */}
        {/* ========================================================================= */}
        {(selectedRankCategoryFilter === 'ALL' || selectedRankCategoryFilter === 'CSP_CP') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSegment('CSP_CP')}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {expandedSegments.CSP_CP ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div>
                  <h2 className="font-bold text-indigo-400 uppercase text-xs flex items-center gap-2">
                    SECTION 3: CHIEF SUPERINTENDENT TO COMMISSIONER (CSP - CP)
                  </h2>
                  <span className="text-slate-400 text-[11px]">
                    Total Personnel: <strong className="text-white">{cspCpList.length}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => exportSegmentToCSV('CSP_CP_Roll', cspCpList)}
                disabled={cspCpList.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 transition font-bold text-[11px] flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSP - CP Roll</span>
              </button>
            </div>

            {expandedSegments.CSP_CP && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-r border-slate-800/60 text-cyan-400">AP/F/NO</th>
                      <th className="p-3 border-r border-slate-800/60 text-indigo-400">RANK</th>
                      <th className="p-3 border-r border-slate-800/60 text-white">OFFICER NAME</th>
                      <th className="p-3 border-r border-slate-800/60">STATE OF ORIGIN</th>
                      <th className="p-3 border-r border-slate-800/60">DUTY POST</th>
                      <th className="p-3 border-r border-slate-800/60">DATE OF ENLISTMENT</th>
                      <th className="p-3 border-r border-slate-800/60 text-amber-400">RETIREMENT DATE</th>
                      <th className="p-3 text-cyan-400">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          Loading CSP to CP records...
                        </td>
                      </tr>
                    ) : cspCpList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          No personnel found under CSP to CP category.
                        </td>
                      </tr>
                    ) : (
                      cspCpList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 border-r border-slate-800/60 font-bold text-cyan-300">{p.apfNo}</td>
                          <td className="p-3 border-r border-slate-800/60 font-bold text-indigo-400">{p.rank}</td>
                          <td className="p-3 border-r border-slate-800/60 font-bold text-white">
                            <Link href={`/personnel/${p.id}`} className="hover:text-cyan-400 underline decoration-dashed transition">
                              {p.fullName}
                            </Link>
                          </td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.stateOfOrigin}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.dutyPost}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateOfEnlistment}</td>
                          <td className="p-3 border-r border-slate-800/60 text-amber-400 font-bold">{p.retirementDate}</td>
                          <td className="p-3 font-bold uppercase text-emerald-400">{p.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
