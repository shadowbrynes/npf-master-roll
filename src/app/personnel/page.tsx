'use client';

import React, { useState } from 'react';
import Shell from '@/components/layout/Shell';
import { Users, Search, Download, Shield, Eye } from 'lucide-react';
import { PersonnelMasterRecord } from '@/types';

export default function PersonnelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('ALL');

  const demoPersonnel: PersonnelMasterRecord[] = [
    {
      id: '1',
      apfNo: 'AP/117369',
      rank: 'CSP',
      fullName: 'DESMOND AGBALA',
      educationalQualification: 'BSC POLICE SCIENCE',
      stateOfOrigin: 'FCT',
      phoneNumber: '08033752122',
      dateOfBirth: '1976-12-22',
      dateOfEnlistment: '1999-12-01',
      retirementDate: '2034-12-01',
      calculatedRetirementDate: '2034-12-01',
      dutyPost: 'CMDR.',
      gdSp: 'GD',
      gradeLevel: '13',
      bankName: 'UBA',
      employeeCode: 'NP144326',
      ippisNumber: 'PF027452',
      gender: 'MALE',
      status: 'active',
      isArchived: false,
      hasRetirementOverride: false,
    },
    {
      id: '2',
      apfNo: 'AP/190509',
      rank: 'SP',
      fullName: 'RACHAEL ARIWERIOKUMA',
      educationalQualification: 'BSC',
      stateOfOrigin: 'RVS',
      phoneNumber: '08030986847',
      dateOfBirth: '1985-07-18',
      dateOfEnlistment: '2016-12-31',
      retirementDate: '2045-07-18',
      calculatedRetirementDate: '2045-07-18',
      dutyPost: '2/IC',
      gdSp: 'GD',
      gradeLevel: '12',
      bankName: 'FIRST BANK',
      employeeCode: 'NP316462',
      ippisNumber: 'PF0297478',
      gender: 'FEMALE',
      status: 'active',
      isArchived: false,
      hasRetirementOverride: false,
    },
  ];

  const filtered = demoPersonnel.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apfNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.stateOfOrigin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRank = selectedRank === 'ALL' || p.rank === selectedRank;
    return matchesSearch && matchesRank;
  });

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
                AUTHORISED NATIONAL MASTER NOMINAL ROLL
              </h1>
              <p className="text-slate-400 mt-1">
                Central EOD CBRN Personnel Directory • RLS Scope Encapsulation
              </p>
            </div>
          </div>

          <button className="px-4 py-2.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900 transition flex items-center gap-2 font-bold uppercase">
            <Download className="w-4 h-4" />
            <span>Export Authorized Roll</span>
          </button>
        </div>

        {/* SEARCH & FILTER TOOLBAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Name, AP/F/NO, State of Origin..."
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
            </select>
          </div>
        </div>

        {/* MASTER ROLL DATA TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3 border-r border-slate-800/60 text-amber-400">AP/F/NO</th>
                  <th className="p-3 border-r border-slate-800/60 text-emerald-400">RANK</th>
                  <th className="p-3 border-r border-slate-800/60 text-sky-300">FULL NAME</th>
                  <th className="p-3 border-r border-slate-800/60">STATE OF ORIGIN</th>
                  <th className="p-3 border-r border-slate-800/60">DATE OF BIRTH</th>
                  <th className="p-3 border-r border-slate-800/60">DATE OF ENLIST</th>
                  <th className="p-3 border-r border-slate-800/60 text-rose-400">RETIREMENT DATE</th>
                  <th className="p-3 border-r border-slate-800/60">DUTY POST</th>
                  <th className="p-3 border-r border-slate-800/60 text-teal-400">STATUS</th>
                  <th className="p-3 text-amber-400">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 border-r border-slate-800/60 font-bold text-amber-300">{p.apfNo}</td>
                    <td className="p-3 border-r border-slate-800/60 font-bold text-emerald-400">{p.rank}</td>
                    <td className="p-3 border-r border-slate-800/60 font-bold text-white">{p.fullName}</td>
                    <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.stateOfOrigin}</td>
                    <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateOfBirth}</td>
                    <td className="p-3 border-r border-slate-800/60 text-slate-400">{p.dateOfEnlistment}</td>
                    <td className="p-3 border-r border-slate-800/60 font-bold text-rose-400">{p.retirementDate}</td>
                    <td className="p-3 border-r border-slate-800/60 text-slate-300">{p.dutyPost}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
