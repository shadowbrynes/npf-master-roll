'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import { FileText, Upload, Lock, Shield } from 'lucide-react';

export default function Gen60Page() {
  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                GEN.60 FORM MANAGEMENT &amp; PRIVATE STORAGE
              </h1>
              <p className="text-slate-400 mt-1">
                Annual Appraisal Forms • Private Supabase Storage • 15-Minute Signed URLs
              </p>
            </div>
          </div>

          <button className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition flex items-center gap-2 font-bold uppercase shadow-lg shadow-teal-950/50">
            <Upload className="w-4 h-4" />
            <span>Upload Gen.60 Form</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-teal-400" />
              <div>
                <span className="text-white font-bold block">GEN.60 APPRAISAL FORM 2025 - INSPR. GODWIN UMOH</span>
                <span className="text-slate-400 text-[11px] block">Uploaded: 2025-11-10 • Status: APPROVED</span>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-xl bg-slate-800 text-cyan-300 hover:text-white transition font-bold text-[11px]">
              View Signed URL (15m Expire)
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
