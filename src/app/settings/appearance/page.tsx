'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Shell from '@/components/layout/Shell';
import { Sliders, Upload, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Shield, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { blendEodCbrnImages } from '@/lib/image-blender';

export default function DashboardAppearanceSettingsPage() {
  const supabase = createClient();

  const [img1Preview, setImg1Preview] = useState<string>('/images/EOD-CBRN1.jpg');
  const [img2Preview, setImg2Preview] = useState<string>('/images/EOD-CBRN2.jpg');
  const [img1File, setImg1File] = useState<File | null>(null);
  const [img2File, setImg2File] = useState<File | null>(null);

  const [blendedPreviewUrl, setBlendedPreviewUrl] = useState<string>('');
  const [blendedBlob, setBlendedBlob] = useState<Blob | null>(null);

  const [processing, setProcessing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [activeAssetPath, setActiveAssetPath] = useState<string>('');

  useEffect(() => {
    async function loadCurrentAsset() {
      try {
        const { data } = await supabase
          .from('dashboard_assets')
          .select('*')
          .eq('image_type', 'blended_hero')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.storage_path) {
          setActiveAssetPath(data.storage_path);
          const { data: urlData } = supabase.storage
            .from('eod-cbrn-dashboard-assets')
            .getPublicUrl(data.storage_path);

          if (urlData?.publicUrl) {
            setBlendedPreviewUrl(urlData.publicUrl);
          }
        }
      } catch (err) {
        console.warn('Load active dashboard asset exception:', err);
      }
    }

    loadCurrentAsset();
  }, [supabase]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`Image EOD-CBRN${imageNumber} exceeds maximum allowed size of 5MB.`);
      return;
    }

    // Validate type (JPEG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(`Unsupported file type for EOD-CBRN${imageNumber}. Allowed: JPEG, PNG, WEBP.`);
      return;
    }

    setErrorMsg('');
    const objectUrl = URL.createObjectURL(file);
    if (imageNumber === 1) {
      setImg1File(file);
      setImg1Preview(objectUrl);
    } else {
      setImg2File(file);
      setImg2Preview(objectUrl);
    }
  };

  const handleGenerateBlend = async () => {
    setProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Execute Canvas AI-assisted multi-stage blend (1920x1080)
      const blob = await blendEodCbrnImages(img1Preview, img2Preview, {
        width: 1920,
        height: 1080,
        quality: 0.92,
        darknessOverlay: 0.75
      });

      setBlendedBlob(blob);
      const previewUrl = URL.createObjectURL(blob);
      setBlendedPreviewUrl(previewUrl);
      setSuccessMsg('AI image blending completed successfully! Click "Apply & Deploy Background" to save to Supabase Storage.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI blending failed.';
      console.error('Blending Exception:', err);
      setErrorMsg(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeployBackground = async () => {
    if (!blendedBlob) {
      setErrorMsg('Please click "Generate AI Blended Background" first.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const timestamp = Date.now();
      const storagePath = `blended-hero/EOD_CBRN_BLENDED_HERO_${timestamp}.jpg`;

      // 1. Upload blended image blob to Supabase Storage Bucket
      const { error: uploadError } = await supabase.storage
        .from('eod-cbrn-dashboard-assets')
        .upload(storagePath, blendedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
      }

      // 2. Supersede old active assets in database
      await supabase
        .from('dashboard_assets')
        .update({ status: 'superseded' })
        .eq('image_type', 'blended_hero')
        .eq('status', 'active');

      // 3. Insert new asset metadata into public.dashboard_assets
      const { data: assetData, error: dbError } = await supabase
        .from('dashboard_assets')
        .insert({
          asset_name: 'EOD-CBRN Blended Hero Background',
          original_filename: 'EOD-CBRN1_EOD-CBRN2_Blended.jpg',
          storage_path: storagePath,
          image_type: 'blended_hero',
          aspect_ratio: '16:9',
          mime_type: 'image/jpeg',
          file_size_bytes: blendedBlob.size,
          status: 'active'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database metadata record creation failed: ${dbError.message}`);
      }

      // 4. Log Audit Entry
      await supabase.from('audit_logs').insert({
        action: 'dashboard_asset_updated',
        entity_type: 'dashboard_assets',
        entity_id: assetData.id,
        actor_role: 'global_admin',
        result: 'SUCCESS'
      });

      setActiveAssetPath(storagePath);
      setSuccessMsg('Blended EOD CBRN Dashboard Background successfully deployed to Production!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deployment failed.';
      console.error('Deploy Exception:', err);
      setErrorMsg(msg);
    } finally {
      setUploading(false);
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
                DASHBOARD APPEARANCE &amp; AI IMAGE BLENDING SETTINGS
              </h1>
              <p className="text-slate-400 mt-1">
                Global Administrator Management Panel • Upload EOD-CBRN1 &amp; EOD-CBRN2 • Supabase Storage
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

        {/* IMAGE UPLOAD & PREVIEW GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UPLOAD CONTAINER 1: EOD-CBRN1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-cyan-400 uppercase text-xs flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                EOD-CBRN1 (Base Image)
              </h3>
              <span className="text-[10px] text-slate-500">Max 5MB • JPEG/PNG/WEBP</span>
            </div>

            <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <Image
                src={img1Preview}
                alt="EOD-CBRN1 Preview"
                fill
                className="object-cover"
              />
            </div>

            <label className="block w-full text-center py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition">
              <Upload className="w-4 h-4 inline-block mr-2 text-cyan-400" />
              <span>{img1File ? img1File.name : 'Choose EOD-CBRN1 Image'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageChange(e, 1)}
                className="hidden"
              />
            </label>
          </div>

          {/* UPLOAD CONTAINER 2: EOD-CBRN2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-emerald-400 uppercase text-xs flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                EOD-CBRN2 (Secondary Layer)
              </h3>
              <span className="text-[10px] text-slate-500">Max 5MB • JPEG/PNG/WEBP</span>
            </div>

            <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <Image
                src={img2Preview}
                alt="EOD-CBRN2 Preview"
                fill
                className="object-cover"
              />
            </div>

            <label className="block w-full text-center py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition">
              <Upload className="w-4 h-4 inline-block mr-2 text-emerald-400" />
              <span>{img2File ? img2File.name : 'Choose EOD-CBRN2 Image'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageChange(e, 2)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* AI BLENDING PROCESS CONTROL PANEL */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                AI IMAGE BLENDING &amp; COMPOSITING ENGINE
              </h2>
              <p className="text-slate-400 mt-1 text-[11px]">
                Combines EOD-CBRN1 + EOD-CBRN2 with multi-stage gradient masks and dark vignette contrast balance
              </p>
            </div>

            <button
              onClick={handleGenerateBlend}
              disabled={processing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold transition shadow-lg flex items-center gap-2 uppercase tracking-wider"
            >
              <Sparkles className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
              <span>{processing ? 'Processing AI Blend...' : 'Generate AI Blended Background'}</span>
            </button>
          </div>

          {/* BLENDED PREVIEW PREVIEWER */}
          {blendedPreviewUrl && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase">Live Blended Hero Preview (16:9 Desktop):</h3>
              <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                <Image
                  src={blendedPreviewUrl}
                  alt="Blended Hero Preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 p-6 flex flex-col justify-end">
                  <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-bold uppercase w-max">
                    Live Blend Composition
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDeployBackground}
                  disabled={uploading}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-xl flex items-center gap-2 uppercase tracking-wider"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{uploading ? 'Deploying Background...' : 'Apply & Deploy Background'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
