'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/layout/Shell';
import { Users, Search, Download, Shield, Eye, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PERSONNEL_26_HEADINGS } from '@/lib/personnel-fields';

interface MasterRollRecord {
  id: string;
  apfNo: string;
  rank: string;
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
  const [selectedRank, setSelectedRank] = useState('ALL');
  const [personnelList, setPersonnelList] = useState<MasterRollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'sectionA' | 'sectionB' | 'sectionC'>('all');

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Query personnel table and left join personnel_private
      const { data, error } = await supabase
        .from('personnel')
        .select(`
          *,
          personnel_private (*)
        `)
        .order('created_at', { ascending: false });

      console.log('Master Roll Query Result:', { data, error });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const mapped: MasterRollRecord[] = data.map((item: any) => {
          const priv = Array.isArray(item.personnel_private) ? item.personnel_private[0] : item.personnel_private;
          return {
            id: item.id,
            apfNo: item.apf_no || item.service_number || '',
            rank: item.rank || '',
            fullName: item.full_name || `${item.surname || ''} ${item.first_name || ''}`.trim(),
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
            dutyPost: item.duty_post || '',
            dateTransferred: item.date_transferred_to_command || item.transferred_date || '',
            gdSp: item.gd_sp || 'GD',

            gradeLevel: item.grade_level || item.gl || '',
            bankName: priv?.bank_name || '',
            employeeCode: item.employee_code || '',
            ippisNumber: priv?.ippis_number || '',
            pfa: priv?.pfa || '',
            penPin: priv?.pen_pin || '',
            nhfNumber: priv?.nhf_number || '',
            assignedUnit: item.unit_id || 'EOD COMMAND',
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

  const filtered = personnelList.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apfNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.stateOfOrigin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dutyPost.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRank = selectedRank === 'ALL' || p.rank === selectedRank;
    return matchesSearch && matchesRank;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = PERSONNEL_26_HEADINGS.map((h) => h.label).join(',');
    const rows = filtered.map((p) =>
      [
        `"${p.apfNo}"`,
        `"${p.rank}"`,
        `"${p.fullName}"`,
        `"${p.educationalQualification}"`,
        `"${p.stateOfOrigin}"`,
        `"${p.phoneNumber}"`,
        `"${p.tribe}"`,
        `"${p.dateOfBirth}"`,
        `"${p.geopoliticalZone}"`,
        `"${p.emailAddress}"`,
        `"${p.mss}"`,
        `"${p.dateOfEnlistment}"`,
        `"${p.dateOfLastPromotion}"`,
        `"${p.retirementDate}"`,
        `"${p.commandServedLast}"`,
        `"${p.dutyPost}"`,
        `"${p.dateTransferred}"`,
        `"${p.gdSp}"`,
        `"${p.gradeLevel}"`,
        `"${p.bankName}"`,
        `"${p.employeeCode}"`,
        `"${p.ippisNumber}"`,
        `"${p.pfa}"`,
        `"${p.penPin}"`,
        `"${p.nhfNumber}"`,
        `"${p.assignedUnit}"`
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NPF_EOD_MASTER_ROLL_${new Date().toISOString().slice(0, 10)}.csv`);
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
                AUTHORISED NATIONAL MASTER NOMINAL ROLL (26 HEADINGS)
              </h1>
              <p className="text-slate-400 mt-1">
                Central EOD CBRN Personnel Directory • Live Supabase PostgreSQL Integration ({filtered.length} Records)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPersonnel}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900 transition flex items-center gap-2 font-bold uppercase"
            >
              <Download className="w-4 h-4" />
              <span>Export Authorized Roll</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SEARCH & SECTION TABS TOOLBAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Name, AP/F/NO, State of Origin, Duty Post..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Police Ranks</option>
                <option value="CSP">CSP</option>
                <option value="SP">SP</option>
                <option value="DSP">DSP</option>
                <option value="ASP">ASP</option>
                <option value="INSPR">INSPR</option>
                <option value="SGT">SGT</option>
                <option value="CPL">CPL</option>
                <option value="PC">PC</option>
              </select>
            </div>
          </div>

          {/* 26 HEADINGS SECTION TAB SELECTOR */}
          <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              All 26 Headings
            </button>
            <button
              onClick={() => setActiveTab('sectionA')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition ${
                activeTab === 'sectionA'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Section A: Personal &amp; Contact (1-11)
            </button>
            <button
              onClick={() => setActiveTab('sectionB')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition ${
                activeTab === 'sectionB'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Section B: Career &amp; Retirement (12-18)
            </button>
            <button
              onClick={() => setActiveTab('sectionC')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition ${
                activeTab === 'sectionC'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Section C: Financial &amp; Pension (19-26)
            </button>
          </div>
        </div>

        {/* MASTER ROLL DATA TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3 border-r border-slate-800/60 text-amber-400">1. AP/F/NO</th>
                  <th className="p-3 border-r border-slate-800/60 text-emerald-400">2. RANK</th>
                  <th className="p-3 border-r border-slate-800/60 text-sky-300">3. FULL NAME</th>

                  {(activeTab === 'all' || activeTab === 'sectionA') && (
                    <>
                      <th className="p-3 border-r border-slate-800/60">4. EDU. QUAL.</th>
                      <th className="p-3 border-r border-slate-800/60">5. STATE ORIGIN</th>
                      <th className="p-3 border-r border-slate-800/60">6. PHONE NO.</th>
                      <th className="p-3 border-r border-slate-800/60">7. TRIBE</th>
                      <th className="p-3 border-r border-slate-800/60">8. DOB</th>
                      <th className="p-3 border-r border-slate-800/60">9. GEO ZONE</th>
                      <th className="p-3 border-r border-slate-800/60">10. EMAIL</th>
                      <th className="p-3 border-r border-slate-800/60">11. MSS</th>
                    </>
                  )}

                  {(activeTab === 'all' || activeTab === 'sectionB') && (
                    <>
                      <th className="p-3 border-r border-slate-800/60">12. ENLIST DATE</th>
                      <th className="p-3 border-r border-slate-800/60">13. LAST PROM.</th>
                      <th className="p-3 border-r border-slate-800/60 text-rose-400">14. RETIREMENT DATE</th>
                      <th className="p-3 border-r border-slate-800/60">15. LAST COMMAND</th>
                      <th className="p-3 border-r border-slate-800/60">16. DUTY POST</th>
                      <th className="p-3 border-r border-slate-800/60">17. TRANSFERRED</th>
                      <th className="p-3 border-r border-slate-800/60">18. GD/SP</th>
                    </>
                  )}

                  {(activeTab === 'all' || activeTab === 'sectionC') && (
                    <>
                      <th className="p-3 border-r border-slate-800/60 text-rose-400">19. G/L</th>
                      <th className="p-3 border-r border-slate-800/60 text-rose-400">20. BANK</th>
                      <th className="p-3 border-r border-slate-800/60 text-rose-400">21. EMP CODE</th>
                      <th className="p-3 border-r border-slate-800/60 text-rose-400">22. IPPIS NO.</th>
                      <th className="p-3 border-r border-slate-800/60 text-rose-400">23. PFA</th>
                      <th className="p-3 border-r border-slate-800/60 text-rose-400">24. PEN PIN</th>
                      <th className="p-3 border-r border-slate-800/60 text-rose-400">25. NHF NO.</th>
                      <th className="p-3 border-r border-slate-800/60">26. ASSIGNED UNIT</th>
                    </>
                  )}

                  <th className="p-3 border-r border-slate-800/60 text-teal-400">STATUS</th>
                  <th className="p-3 text-amber-400">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={30} className="p-8 text-center text-slate-400 font-bold">
                      Loading Master Roll records from Supabase PostgreSQL...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={30} className="p-8 text-center text-slate-400 font-bold">
                      No personnel records found in Supabase Master Roll.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 border-r border-slate-800/60 font-bold text-amber-300">{p.apfNo}</td>
                      <td className="p-3 border-r border-slate-800/60 font-bold text-emerald-400">{p.rank}</td>
                      <td className="p-3 border-r border-slate-800/60 font-bold text-white">{p.fullName}</td>

                      {(activeTab === 'all' || activeTab === 'sectionA') && (
                        <>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.educationalQualification || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.stateOfOrigin || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.phoneNumber || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.tribe || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateOfBirth || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.geopoliticalZone || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.emailAddress || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.mss || '-'}</td>
                        </>
                      )}

                      {(activeTab === 'all' || activeTab === 'sectionB') && (
                        <>
                          <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateOfEnlistment || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateOfLastPromotion || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 font-bold text-rose-400">{p.retirementDate || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.commandServedLast || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.dutyPost || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateTransferred || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.gdSp || 'GD'}</td>
                        </>
                      )}

                      {(activeTab === 'all' || activeTab === 'sectionC') && (
                        <>
                          <td className="p-3 border-r border-slate-800/60 text-rose-300 font-mono">{p.gradeLevel || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-rose-300 font-mono">{p.bankName || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-rose-300 font-mono">{p.employeeCode || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-rose-300 font-mono">{p.ippisNumber || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-rose-300 font-mono">{p.pfa || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-rose-300 font-mono">{p.penPin || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-rose-300 font-mono">{p.nhfNumber || '-'}</td>
                          <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.assignedUnit || '-'}</td>
                        </>
                      )}

                      <td className="p-3 border-r border-slate-800/60">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 hover:text-white transition flex items-center gap-1 font-bold">
                          <Eye className="w-3.5 h-3.5" /> Dossier
                        </button>
                      </td>
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
