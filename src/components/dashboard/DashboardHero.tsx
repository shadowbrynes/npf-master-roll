'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Lock, Sliders, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DashboardHeroProps {
  userRole?: string;
}

export default function DashboardHero({ userRole }: DashboardHeroProps) {
  const supabase = createClient();
  const [heroImageUrl, setHeroImageUrl] = useState<string>('/images/EOD-CBRN1.jpg');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadActiveDashboardAsset() {
      try {
        const { data, error } = await supabase
          .from('dashboard_assets')
          .select('*')
          .eq('image_type', 'blended_hero')
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

    loadActiveDashboardAsset();
  }, [supabase]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 font-mono">
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImageUrl}
          alt="NPF EOD CBRN Command Background"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1920px"
          className="object-cover object-center opacity-40 scale-105 transition-all duration-700 hover:scale-100"
          onError={() => setHeroImageUrl('/images/EOD-CBRN1.jpg')}
        />
        {/* Dark Tactical Vignette Overlay for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/80 to-slate-950/90 backdrop-blur-[2px]" />
      </div>

      {/* HERO CONTENT OVERLAY */}
      <div className="relative z-10 p-6 md:p-8 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] text-amber-400 font-bold uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Restricted Law Enforcement System
          </div>

          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-cyan-400 shrink-0" />
            NIGERIA POLICE FORCE EOD CBRN
          </h1>

          <p className="text-sm md:text-base font-bold text-cyan-300">
            Personnel &amp; CBRN Equipment C2 Management Portal
          </p>

          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Authoritative Police Master Roll • 36 State Bases &amp; FCT • CBRN Asset Tracking &amp; Statutory Retirement C2 Operations
          </p>
        </div>

        {/* HERO ACTIONS & STATUS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <span className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            SYSTEM STATUS: ONLINE
          </span>

          {(userRole === 'global_admin' || userRole === 'super_admin' || !userRole) && (
            <Link
              href="/settings/appearance"
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950/60 hover:text-white transition text-xs font-bold uppercase flex items-center gap-2 shadow-lg"
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
