'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import { Cake, Send, Copy, CheckCircle2 } from 'lucide-react';

export default function BirthdaysPage() {
  const greetingTemplate = "Happy Birthday, [Rank] [Name]. The EOD CBRN Command wishes you good health, continued success, and many more years of dedicated service.";

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                BIRTHDAY AUTOMATION &amp; GREETINGS ROSTER
              </h1>
              <p className="text-slate-400 mt-1">
                Automated Daily Birthday Detection • Configurable Greetings Template
              </p>
            </div>
          </div>
        </div>

        {/* TEMPLATE EDITOR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-pink-300 uppercase border-b border-slate-800 pb-2">
            OFFICIAL BIRTHDAY GREETING TEMPLATE
          </h2>
          <textarea
            rows={3}
            defaultValue={greetingTemplate}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-pink-500"
          />
        </div>
      </div>
    </Shell>
  );
}
