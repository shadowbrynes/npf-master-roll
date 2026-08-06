'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Shell from '@/components/layout/Shell';
import DashboardHero from '@/components/dashboard/DashboardHero';
import {
  Users,
  MapPin,
  Radio,
  Clock,
  AlertCircle,
  TrendingUp,
  Shield,
  UserCheck,
  Award,
  Key
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const supabase = createClient();
  const [displayImgUrl, setDisplayImgUrl] = useState<string>('/images/EOD-CBRN2.jpg');

  useEffect(() => {
    async function loadDisplayAsset() {
      try {
        const { data } = await supabase
          .from('dashboard_assets')
          .select('*')
          .in('image_type', ['dashboard_display', 'display'])
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.storage_path) {
          const { data: publicUrlData } = supabase.storage
            .from('eod-cbrn-dashboard-assets')
            .getPublicUrl(data.storage_path);

          if (publicUrlData?.publicUrl) {
            setDisplayImgUrl(publicUrlData.publicUrl);
          }
        }
      } catch (err) {
        console.warn('Dashboard display image load exception:', err);
      }
    }

    loadDisplayAsset();
  }, [supabase]);

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
        {/* HERO SECTION (IMAGE 1: EOD-CBRN1 BACKGROUND) */}
        <DashboardHero userRole="global_admin" />

        {/* TASK 2 & TASK 5: GLOBAL ADMINISTRATOR IDENTITY & EOD-CBRN2 CONTENT DISPLAY CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* IMAGE 2: EOD-CBRN2 FRAMED CONTENT ELEMENT */}
            <div className="relative w-full lg:w-72 h-48 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl shrink-0 group">
              <Image
                src={displayImgUrl}
                alt="NPF EOD CBRN Operational Identity"
                fill
                priority
                className="object-cover object-center group-hover:scale-105 transition duration-500"
                onError={() => setDisplayImgUrl('/images/EOD-CBRN2.jpg')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 flex flex-col justify-end">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold uppercase w-max">
                  Official Visual Identity
                </span>
              </div>
            </div>

            {/* NEW GLOBAL ADMINISTRATOR PROFILE DETAILS */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">
                      INSPR. GODWIN UMOH
                    </h2>
                  </div>
                  <p className="text-amber-400 font-bold text-xs mt-0.5 uppercase tracking-wide">
                    PRIMARY GLOBAL ADMINISTRATOR • NATIONAL COMMAND C2
                  </p>
                </div>

                <span className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  LEVEL 1 AUTHORIZATION
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-bold">COMMAND APPOINTMENT</span>
                  <span className="text-white font-bold block mt-0.5">NATIONAL C2 COMMANDER</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-bold">STATION BASE</span>
                  <span className="text-white font-bold block mt-0.5">FORCE HQ ABUJA</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-bold">ACCESS SCOPE</span>
                  <span className="text-emerald-400 font-bold block mt-0.5">ALL 36 STATES &amp; FCT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
