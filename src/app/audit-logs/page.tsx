'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import { FileSearch, Shield } from 'lucide-react';

export default function AuditLogsPage() {
  const demoLogs = [
    {
      id: 'log-1',
      timestamp: '2026-08-06 09:42:15',
      actor: 'global_admin',
      action: 'PERSONNEL_CREATE',
      entity: 'PERSONNEL',
      details: 'Registered officer AP/117369 in Supabase PostgreSQL Master Roll',
      status: 'SUCCESS',
    },
    {
      id: 'log-2',
      timestamp: '2026-08-06 09:30:10',
      actor: 'system_cron',
      action: 'RETIREMENT_SCAN',
      entity: 'RETIREMENT_ENGINE',
      details: 'Evaluated 24 officers. 1 officer flagged within 60-day warning window.',
      status: 'SUCCESS',
    },
  ];

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileSearch className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                IMMUTABLE SECURITY AUDIT TRAIL LOGS
              </h1>
              <p className="text-slate-400 mt-1">
                Append-Only PostgreSQL Security Audit Trail • Non-Erasable Event History
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3 border-r border-slate-800/60">TIMESTAMP</th>
                  <th className="p-3 border-r border-slate-800/60 text-amber-300">ACTOR ROLE</th>
                  <th className="p-3 border-r border-slate-800/60 text-cyan-400">ACTION</th>
                  <th className="p-3 border-r border-slate-800/60">ENTITY</th>
                  <th className="p-3 border-r border-slate-800/60 text-white">DETAILS</th>
                  <th className="p-3 text-emerald-400">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {demoLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 border-r border-slate-800/60 text-slate-400">{l.timestamp}</td>
                    <td className="p-3 border-r border-slate-800/60 font-bold text-amber-300">{l.actor}</td>
                    <td className="p-3 border-r border-slate-800/60 font-bold text-cyan-400">{l.action}</td>
                    <td className="p-3 border-r border-slate-800/60 text-slate-300">{l.entity}</td>
                    <td className="p-3 border-r border-slate-800/60 text-white">{l.details}</td>
                    <td className="p-3 font-bold text-emerald-400">{l.status}</td>
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
