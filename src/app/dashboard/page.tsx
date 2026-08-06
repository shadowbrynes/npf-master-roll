'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import DashboardHero from '@/components/dashboard/DashboardHero';
import {
  Users,
  MapPin,
  Radio,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const rankData = [
    { rank: 'CSP', count: 1 },
    { rank: 'SP', count: 2 },
    { rank: 'DSP', count: 2 },
    { rank: 'ASP', count: 5 },
    { rank: 'INSPR', count: 12 },
    { rank: 'SGT', count: 2 },
  ];

  const categoryData = [
    { name: 'Disruptors & Suits', value: 14, color: '#06b6d4' },
    { name: 'CBRN Detectors', value: 28, color: '#10b981' },
    { name: 'Counter IED Robots', value: 8, color: '#f59e0b' },
    { name: 'Lab Equipment', value: 12, color: '#8b5cf6' },
  ];

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* REUSABLE HERO BANNER WITH BLENDED EOD CBRN BACKGROUND */}
        <DashboardHero userRole="global_admin" />

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">Total Personnel</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-1">24</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Verified Master Roll</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">State Bases (36 States)</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">36 + 1 FCT</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Command Locations</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">60-Day Retirement Alert</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">1</h3>
              <p className="text-[10px] text-amber-400/80 mt-0.5">High Priority Roster</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-slate-400 text-[11px] font-bold uppercase">CBRN Equipment Gear</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-1">62 Items</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Operational Inventory</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Radio className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 60-DAY RETIREMENT HIGH PRIORITY WARNING BANNER */}
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-amber-300 font-bold uppercase text-xs">
                  STATUTORY RETIREMENT WARNING ROSTER (DUE WITHIN 60 DAYS)
                </h3>
                <p className="text-[11px] text-amber-400/70">
                  Automatic Daily Scanner Result • Mandatory Advance Notice for Global Administrators
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
              1 OFFICER PENDING
            </span>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-amber-400">
                ASP
              </div>
              <div>
                <span className="text-white font-bold block">ASP SAMUEL IKPELE (AP/176009)</span>
                <span className="text-[11px] text-slate-400 block">
                  BASE: LAGOS APAPA SEA PORT EOD BASE • DUTY: A/OII
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-rose-400 block">
                RETIREMENT DATE: 2026-07-01
              </span>
              <span className="text-[10px] text-amber-300 font-bold block">
                BASIS: SERVICE 35 YEARS RULE • (35 DAYS REMAINING)
              </span>
            </div>
          </div>
        </div>

        {/* VISUALISATION CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              PERSONNEL DEMOGRAPHICS BY RANK
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankData}>
                  <XAxis dataKey="rank" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#fff' }} />
                  <Bar dataKey="count" fill="#0891b2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              CBRN EQUIPMENT CATEGORY DISTRIBUTION
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
