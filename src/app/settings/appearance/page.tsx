'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Shell from '@/components/layout/Shell';
import { Sliders, Upload, CheckCircle2, AlertCircle, Shield, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardAppearanceSettingsPage() {
  const supabase = createClient();

  const [bgPreview, setBgPreview] = useState<string>('/images/EOD-CBRN1.jpg');
  const [displayPreview, setDisplayPreview] = useState<string>('/images/EOD-CBRN2.jpg');

  const [bgFile, setBgFile] = useState<File | null>(null);
  const [displayFile, setDisplayFile] = useState<File | null>(null);

  const [uploadingBg, setUploadingBg] = useState<boolean>(false);
  const [uploadingDisplay, setUploadingDisplay] = useState<boolean>(false);

  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    async function loadCurrentAssets() {
      try {
        // Fetch active background asset (EOD-CBRN1)
        const { data: bgData } = await supabase
          .from('dashboard_assets')
          .select('*')
          .in('image_type', ['background', 'dashboard_background'])
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (bgData?.storage_path) {
          const { data: urlData } = supabase.storage
            .from('eod-cbrn-dashboard-assets')
            .getPublicUrl(bgData.storage_path);
          if (urlData?.publicUrl) setBgPreview(urlData.publicUrl);
        }

        // Fetch active display asset (EOD-CBRN2)
        const { data: displayData } = await supabase
          .from('dashboard_assets')
          .select('*')
          .in('image_type', ['dashboard_display', 'display'])
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (displayData?.storage_path) {
          const { data: urlData } = supabase.storage
            .from('eod-cbrn-dashboard-assets')
            .getPublicUrl(displayData.storage_path);
          if (urlData?.publicUrl) setDisplayPreview(urlData.publicUrl);
        }
      } catch (err) {
        console.warn('Load appearance assets error:', err);
      }
    }

    loadCurrentAssets();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'bg' | 'display') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`Selected image exceeds maximum allowed size of 5MB.`);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(`Unsupported file format. Please select a JPEG, PNG, or WEBP image.`);
      return;
    }

    setErrorMsg('');
    const objectUrl = URL.createObjectURL(file);
    if (target === 'bg') {
      setBgFile(file);
      setBgPreview(objectUrl);
    } else {
      setDisplayFile(file);
      setDisplayPreview(objectUrl);
    }
  };

  const handleUploadBackground = async () => {
    if (!bgFile) {
      setErrorMsg('Please select EOD-CBRN1 from your local Pictures folder first.');
      return;
    }

    setUploadingBg(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const timestamp = Date.now();
      const storagePath = `backgrounds/EOD_CBRN1_BG_${timestamp}.${bgFile.name.split('.').pop()}`;

      // Upload to Supabase Storage
      const { error: storageErr } = await supabase.storage
        .from('eod-cbrn-dashboard-assets')
        .upload(storagePath, bgFile, { upsert: true });

      if (storageErr) throw storageErr;

      // Supersede previous background assets
      await supabase
        .from('dashboard_assets')
        .update({ status: 'superseded' })
        .in('image_type', ['background', 'dashboard_background'])
        .eq('status', 'active');

      // Insert new metadata
      const { data: assetData, error: dbErr } = await supabase
        .from('dashboard_assets')
        .insert({
          asset_name: 'EOD-CBRN1 Dashboard Hero Background',
          original_filename: bgFile.name,
          storage_path: storagePath,
          image_type: 'background',
          mime_type: bgFile.type,
          file_size_bytes: bgFile.size,
          status: 'active'
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // Log Audit Entry
      await supabase.from('audit_logs').insert({
        action: 'DASHBOARD_IMAGE_UPLOADED',
        entity_type: 'dashboard_assets',
        entity_id: assetData.id,
        actor_role: 'global_admin',
        result: 'SUCCESS'
      });

      setSuccessMsg('IMAGE 1 (EOD-CBRN1) successfully deployed as Dashboard Hero Background!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      console.error('Background Upload Exception:', err);
      setErrorMsg(msg);
    } finally {
      setUploadingBg(false);
    }
  };

  const handleUploadDisplay = async () => {
    if (!displayFile) {
      setErrorMsg('Please select EOD-CBRN2 from your local Pictures folder first.');
      return;
    }

    setUploadingDisplay(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const timestamp = Date.now();
      const storagePath = `display/EOD_CBRN2_DISPLAY_${timestamp}.${displayFile.name.split('.').pop()}`;

      // Upload to Supabase Storage
      const { error: storageErr } = await supabase.storage
        .from('eod-cbrn-dashboard-assets')
        .upload(storagePath, displayFile, { upsert: true });

      if (storageErr) throw storageErr;

      // Supersede previous display assets
      await supabase
        .from('dashboard_assets')
        .update({ status: 'superseded' })
        .in('image_type', ['dashboard_display', 'display'])
        .eq('status', 'active');

      // Insert new metadata
      const { data: assetData, error: dbErr } = await supabase
        .from('dashboard_assets')
        .insert({
          asset_name: 'EOD-CBRN2 Dashboard Visual Identity Card',
          original_filename: displayFile.name,
          storage_path: storagePath,
          image_type: 'dashboard_display',
          mime_type: displayFile.type,
          file_size_bytes: displayFile.size,
          status: 'active'
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // Log Audit Entry
      await supabase.from('audit_logs').insert({
        action: 'DASHBOARD_IMAGE_CHANGED',
        entity_type: 'dashboard_assets',
        entity_id: assetData.id,
        actor_role: 'global_admin',
        result: 'SUCCESS'
      });

      setSuccessMsg('IMAGE 2 (EOD-CBRN2) successfully deployed to Dashboard Identity Content Card!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      console.error('Display Upload Exception:', err);
      setErrorMsg(msg);
    } finally {
      setUploadingDisplay(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs max-w-5xl mx-auto">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                DASHBOARD APPEARANCE &amp; IMAGE MANAGEMENT
              </h1>
              <p className="text-slate-400 mt-1">
                Global Administrator Control • Independent Placement for EOD-CBRN1 &amp; EOD-CBRN2
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-bold uppercase text-[10px]">
            Global Admin Only
          </span>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* IMAGE UPLOAD & MANAGED USAGE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION 1: IMAGE 1 - EOD-CBRN1 (BACKGROUND) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-cyan-400 uppercase text-xs flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  IMAGE 1: EOD-CBRN1 (Dashboard Background)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Used as Full-Width Hero Background</p>
              </div>
              <span className="text-[10px] text-slate-500">Max 5MB</span>
            </div>

            <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <Image
                src={bgPreview}
                alt="EOD-CBRN1 Preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/40 p-3 flex flex-col justify-end">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[9px] font-bold uppercase w-max">
                  Full-Width Hero Background
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block w-full text-center py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition">
                <Upload className="w-4 h-4 inline-block mr-2 text-cyan-400" />
                <span>{bgFile ? bgFile.name : 'Select EOD-CBRN1 from Pictures Folder'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileChange(e, 'bg')}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleUploadBackground}
                disabled={uploadingBg || !bgFile}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 uppercase"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{uploadingBg ? 'Uploading Background...' : 'Deploy as Hero Background'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: IMAGE 2 - EOD-CBRN2 (DASHBOARD DISPLAY CONTENT CARD) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-emerald-400 uppercase text-xs flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  IMAGE 2: EOD-CBRN2 (Visual Identity Card)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Used as Admin Identity Content Card</p>
              </div>
              <span className="text-[10px] text-slate-500">Max 5MB</span>
            </div>

            <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <Image
                src={displayPreview}
                alt="EOD-CBRN2 Preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/40 p-3 flex flex-col justify-end">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold uppercase w-max">
                  Command Identity Card Element
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block w-full text-center py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition">
                <Upload className="w-4 h-4 inline-block mr-2 text-emerald-400" />
                <span>{displayFile ? displayFile.name : 'Select EOD-CBRN2 from Pictures Folder'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileChange(e, 'display')}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleUploadDisplay}
                disabled={uploadingDisplay || !displayFile}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 uppercase"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{uploadingDisplay ? 'Uploading Display...' : 'Deploy to Identity Card'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
