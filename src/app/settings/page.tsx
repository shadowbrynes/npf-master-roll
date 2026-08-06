'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import { Settings, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs max-w-4xl mx-auto">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                SYSTEM CONFIGURATION &amp; STATUTORY RULES
              </h1>
              <p className="text-slate-400 mt-1">
                Global Administrator Configurable Policy Engine &amp; System Parameters
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <h2 className="text-sm font-bold text-cyan-400 uppercase border-b border-slate-800 pb-2">
            1. STATUTORY RETIREMENT POLICY PARAMETERS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">MAX RETIREMENT AGE (YRS)</label>
              <input
                type="number"
                defaultValue={60}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">MAX SERVICE YEARS</label>
              <input
                type="number"
                defaultValue={35}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">ADVANCE WARNING NOTICE (DAYS)</label>
              <input
                type="number"
                defaultValue={60}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-950/50 flex items-center gap-2 uppercase">
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
