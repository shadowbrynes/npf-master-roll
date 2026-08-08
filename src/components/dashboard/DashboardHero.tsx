'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Lock, Sliders } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DashboardHeroProps {
  userRole?: string;
}

export default function DashboardHero({ userRole }: DashboardHeroProps) {
  const supabase = createClient();
  const [heroImageUrl, setHeroImageUrl] = useState<string>('/images/EOD-CBRN1.jpg');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadHeroBackgroundAsset() {
      try {
        const { data } = await supabase
          .from('dashboard_assets')
          .select('*')
          .in('image_type', ['background', 'dashboard_background', 'blended_hero'])
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.storage_path) {
          const { data: publicUrlData } = supabase.storage
            .from('eod-cbrn-dashboard-assets')
            .getPublicUrl(data.storage_path);

          if (publicUrlData?.publicUrl) {
            setHeroImageUrl(publicUrlData.publicUrl);
          }
        }
      } catch (err) {
        console.warn('DashboardHero asset load fallback:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHeroBackgroundAsset();
  }, [supabase]);

  return (
    <div className="relative w-full min-h-[220px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 font-mono">
      {/* IMAGE 1: EOD-CBRN1 FULL-WIDTH BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImageUrl}
          alt="Nigeria Police Force EOD CBRN Background"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1920px"
          className="object-cover object-center opacity-70 scale-100 transition-all duration-700 hover:scale-105"
          onError={() => setHeroImageUrl('/images/EOD-CBRN1.jpg')}
        />
        {/* Dark Security Overlay for Optimum Contrast & Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/90 backdrop-blur-[1px]" />
      </div>

      {/* HERO OVERLAY TEXT CONTENT */}
      <div className="relative z-10 p-6 md:p-8 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[10px] text-amber-300 font-bold uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Restricted Law Enforcement System
          </span>

          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3 drop-shadow-md">
            <ShieldCheck className="w-7 h-7 text-cyan-400 shrink-0" />
            NIGERIA POLICE FORCE EOD CBRN
          </h1>

          <p className="text-sm md:text-base font-bold text-cyan-300 drop-shadow">
            Personnel &amp; CBRN Equipment C2 Management Portal
          </p>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-semibold drop-shadow">
            Authoritative Police Master Roll • 36 State Bases &amp; FCT • CBRN Asset Tracking &amp; Statutory Retirement C2 Operations
          </p>
        </div>

        {/* HERO ACTIONS & STATUS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <span className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            SYSTEM STATUS: ONLINE
          </span>

          {(userRole === 'global_admin' || userRole === 'super_admin' || !userRole) && (
            <Link
              href="/settings/appearance"
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-950 hover:text-white transition text-xs font-bold uppercase flex items-center gap-2 shadow-xl btn-primary-breathing"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Appearance Settings</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
