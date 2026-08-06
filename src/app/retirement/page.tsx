'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import { Clock, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

export default function RetirementPage() {
  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                STATUTORY RETIREMENT WARNING ROSTER &amp; AUTOMATION
              </h1>
              <p className="text-slate-400 mt-1">
                Automated 60/35 Statutory Calculation Engine • 60-Day Advance Notification Scanner
              </p>
            </div>
          </div>
        </div>

        {/* 60-DAY WARNING BANNER */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-amber-300 uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              OFFICERS RETIRING WITHIN 60 DAYS (HIGH PRIORITY)
            </h2>
            <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
              1 ACTIVE ALERT
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-white font-bold text-sm block">ASP SAMUEL IKPELE (AP/176009)</span>
              <span className="text-slate-400 block">BASE: LAGOS APAPA SEA PORT EOD BASE • DUTY: A/OII</span>
              <span className="text-slate-500 text-[11px] block">DOB: 1969-06-10 | ENLIST: 1991-07-01</span>
            </div>

            <div className="text-right">
              <span className="text-rose-400 font-bold text-sm block">EFFECTIVE RETIREMENT: 2026-07-01</span>
              <span className="text-amber-300 font-bold text-xs block">BASIS: SERVICE 35 YEARS RULE</span>
              <span className="text-slate-400 text-[11px] block">DAYS REMAINING: 35 DAYS</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
