'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Shell from '@/components/layout/Shell';
import {
  User,
  Shield,
  Award,
  FileText,
  Building,
  Calendar,
  Phone,
  Mail,
  Upload,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Lock,
  RefreshCw,
  Plus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface PersonnelProfileData {
  id: string;
  apfNo: string;
  rank: string;
  rankCategory: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  educationalQualification: string;
  stateOfOrigin: string;
  tribe: string;
  geopoliticalZone: string;
  phoneNumber: string;
  emailAddress: string;

  dateOfEnlistment: string;
  dateOfLastPromotion: string;
  retirementDate: string;
  commandServedLast: string;
  dutyPost: string;
  dateTransferred: string;
  gdSp: string;
  assignedUnit: string;
  status: string;

  gradeLevel: string;
  bankName: string;
  employeeCode: string;
  ippisNumber: string;
  pfa: string;
  penPin: string;
}

interface TrainingRecord {
  id: string;
  courseName: string;
  category: string;
  provider: string;
  completionDate: string;
  expiryDate: string;
  status: string;
  storagePath: string | null;
}

interface PromotionRecord {
  id: string;
  previousRank: string;
  newRank: string;
  promotionDate: string;
  authority: string;
}

interface DocumentRecord {
  id: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
}

export default function PersonnelProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: personnelId } = use(params);
  const supabase = createClient();

  const [profile, setProfile] = useState<PersonnelProfileData | null>(null);
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'personal' | 'service' | 'posting' | 'training' | 'promotions' | 'documents'>('personal');

  // Add Training Modal State
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('CBRN');
  const [newProvider, setNewProvider] = useState('');
  const [newCompletionDate, setNewCompletionDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [submittingTraining, setSubmittingTraining] = useState(false);

  const fetchProfileDetails = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch main personnel record & private details
      const { data: pData, error: pErr } = await supabase
        .from('personnel')
        .select(`
          *,
          personnel_private (*)
        `)
        .eq('id', personnelId)
        .single();

      if (pErr || !pData) throw new Error(pErr?.message || 'Personnel profile not found.');

      const priv = Array.isArray(pData.personnel_private) ? pData.personnel_private[0] : pData.personnel_private;

      setProfile({
        id: pData.id,
        apfNo: pData.apf_no || pData.service_number || '',
        rank: pData.rank || 'UNSPECIFIED',
        rankCategory: pData.rank_category || 'PC_INSPECTOR',
        fullName: pData.full_name || `${pData.surname || ''} ${pData.first_name || ''}`.trim(),
        gender: pData.gender || 'MALE',
        dateOfBirth: pData.date_of_birth || '',
        educationalQualification: pData.educational_qualification || '',
        stateOfOrigin: pData.state_of_origin || '',
        tribe: pData.tribe || '',
        geopoliticalZone: pData.geopolitical_zone || '',
        phoneNumber: priv?.phone_number || '',
        emailAddress: priv?.email_address || '',

        dateOfEnlistment: pData.date_of_enlistment || '',
        dateOfLastPromotion: pData.date_of_last_promotion || '',
        retirementDate: pData.retirement_date || pData.calculated_retirement_date || '',
        commandServedLast: pData.command_served_last || '',
        dutyPost: pData.duty_post || 'TACTICAL OPERATOR',
        dateTransferred: pData.date_transferred_to_command || '',
        gdSp: pData.gd_sp || 'GD',
        assignedUnit: pData.unit_id || 'EOD COMMAND BASE',
        status: pData.status || 'active',

        gradeLevel: pData.grade_level || '',
        bankName: priv?.bank_name || '',
        employeeCode: pData.employee_code || '',
        ippisNumber: priv?.ippis_number || '',
        pfa: priv?.pfa || '',
        penPin: priv?.pen_pin || '',
      });

      // 2. Fetch trainings
      const { data: tData } = await supabase
        .from('personnel_trainings')
        .select('*')
        .eq('personnel_id', personnelId)
        .order('completion_date', { ascending: false });

      if (tData) {
        setTrainings(
          tData.map((t) => ({
            id: t.id,
            courseName: t.course_name,
            category: t.category,
            provider: t.provider || '',
            completionDate: t.completion_date || '',
            expiryDate: t.expiry_date || '',
            status: t.status || 'active',
            storagePath: t.certificate_storage_path,
          }))
        );
      }

      // 3. Fetch promotions
      const { data: promData } = await supabase
        .from('personnel_promotions_history')
        .select('*')
        .eq('personnel_id', personnelId)
        .order('promotion_date', { ascending: false });

      if (promData) {
        setPromotions(
          promData.map((pr) => ({
            id: pr.id,
            previousRank: pr.previous_rank,
            newRank: pr.new_rank,
            promotionDate: pr.promotion_date,
            authority: pr.authority || 'FORCE HEADQUARTERS',
          }))
        );
      }

      // 4. Fetch documents
      const { data: docData } = await supabase
        .from('personnel_documents')
        .select('*')
        .eq('personnel_id', personnelId)
        .order('created_at', { ascending: false });

      if (docData) {
        setDocuments(
          docData.map((d) => ({
            id: d.id,
            documentType: d.document_type,
            fileName: d.file_name,
            storagePath: d.storage_path,
            createdAt: d.created_at,
          }))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading profile.';
      console.error('Profile fetch exception:', err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [personnelId, supabase]);

  useEffect(() => {
    fetchProfileDetails();
  }, [fetchProfileDetails]);

  // Handle Add Training
  const handleAddTrainingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTraining(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.from('personnel_trainings').insert({
        personnel_id: personnelId,
        course_name: newCourseName.trim(),
        category: newCourseCategory,
        provider: newProvider.trim() || null,
        completion_date: newCompletionDate || null,
        expiry_date: newExpiryDate || null,
        status: 'active',
      });

      if (error) throw error;

      setSuccessMsg(`Training course "${newCourseName}" registered successfully!`);
      setShowAddTraining(false);
      setNewCourseName('');
      fetchProfileDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add training.';
      setErrorMsg(msg);
    } finally {
      setSubmittingTraining(false);
    }
  };

  // Generate 15-Minute Signed URL
  const handleViewSignedDocument = async (storagePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('personnel-documents')
        .createSignedUrl(storagePath, 900);

      if (error || !data?.signedUrl) {
        throw new Error('Document file not found or access denied.');
      }

      window.open(data.signedUrl, '_blank');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signed URL generation failed.';
      setErrorMsg(msg);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="p-12 text-center text-slate-400 font-mono text-xs font-bold">
          Loading Officer Profile Dossier from Supabase C2 Database...
        </div>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <div className="p-8 text-center text-rose-400 font-mono text-xs font-bold space-y-4">
          <p>Officer Personnel Record Not Found.</p>
          <Link href="/personnel" className="px-4 py-2 bg-slate-800 text-white rounded-xl inline-block">
            Back to Master Roll
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* TOP BAR / BACK LINK */}
        <div className="flex items-center justify-between">
          <Link
            href="/personnel"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2 font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Return to Master Roll</span>
          </Link>

          <button
            onClick={fetchProfileDetails}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2 font-bold"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Refresh Profile</span>
          </button>
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

        {/* OFFICER PROFILE DOSSIER HERO HEADER */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <User className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold text-[10px] uppercase">
                  {profile.rank}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 font-bold text-[10px] uppercase">
                  {profile.apfNo}
                </span>
              </div>
              <h1 className="text-xl font-black text-white mt-1.5 uppercase tracking-wider">
                {profile.fullName}
              </h1>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {profile.dutyPost} • {profile.stateOfOrigin} STATE OF ORIGIN
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-slate-400 text-[10px] font-bold uppercase">SERVICE STATUS</span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
              {profile.status}
            </span>
          </div>
        </div>

        {/* DOSSIER TAB NAVIGATION */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'personal', label: 'Personal Information', icon: User },
            { id: 'service', label: 'Service & Career', icon: Briefcase },
            { id: 'posting', label: 'Posting & Command', icon: Building },
            { id: 'training', label: `Training & Certs (${trainings.length})`, icon: Award },
            { id: 'promotions', label: `Promotions (${promotions.length})`, icon: Shield },
            { id: 'documents', label: `Document Vault (${documents.length})`, icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-cyan-400 uppercase text-xs border-b border-slate-800 pb-2">IDENTITY DETAILS</h3>
                <div className="space-y-2 text-slate-300">
                  <p><strong className="text-slate-400">FULL NAME:</strong> {profile.fullName}</p>
                  <p><strong className="text-slate-400">AP/F SERVICE NO:</strong> {profile.apfNo}</p>
                  <p><strong className="text-slate-400">RANK:</strong> {profile.rank}</p>
                  <p><strong className="text-slate-400">GENDER:</strong> {profile.gender}</p>
                  <p><strong className="text-slate-400">DATE OF BIRTH:</strong> {profile.dateOfBirth}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-cyan-400 uppercase text-xs border-b border-slate-800 pb-2">ORIGIN &amp; CONTACT</h3>
                <div className="space-y-2 text-slate-300">
                  <p><strong className="text-slate-400">STATE OF ORIGIN:</strong> {profile.stateOfOrigin}</p>
                  <p><strong className="text-slate-400">GEO POL ZONE:</strong> {profile.geopoliticalZone}</p>
                  <p><strong className="text-slate-400">TRIBE:</strong> {profile.tribe}</p>
                  <p><strong className="text-slate-400">EDUCATIONAL QUALIFICATION:</strong> {profile.educationalQualification}</p>
                  <p><strong className="text-slate-400">PHONE NUMBER:</strong> {profile.phoneNumber || 'N/A'}</p>
                  <p><strong className="text-slate-400">EMAIL ADDRESS:</strong> {profile.emailAddress || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-amber-400 uppercase text-xs border-b border-slate-800 pb-2">CAREER &amp; SERVICE MILESTONES</h3>
                <div className="space-y-2 text-slate-300">
                  <p><strong className="text-slate-400">DATE OF ENLISTMENT:</strong> {profile.dateOfEnlistment}</p>
                  <p><strong className="text-slate-400">DATE OF LAST PROMOTION:</strong> {profile.dateOfLastPromotion}</p>
                  <p><strong className="text-slate-400">CALCULATED RETIREMENT DATE:</strong> <span className="text-amber-400 font-bold">{profile.retirementDate}</span></p>
                  <p><strong className="text-slate-400">SPECIALIZATION (GD/SP):</strong> {profile.gdSp}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-amber-400 uppercase text-xs border-b border-slate-800 pb-2">PAYROLL &amp; FINANCIAL DOSSIER</h3>
                <div className="space-y-2 text-slate-300">
                  <p><strong className="text-slate-400">GRADE LEVEL:</strong> {profile.gradeLevel || 'N/A'}</p>
                  <p><strong className="text-slate-400">EMPLOYEE CODE:</strong> {profile.employeeCode || 'N/A'}</p>
                  <p><strong className="text-slate-400">BANK NAME:</strong> {profile.bankName || 'RESTRICTED'}</p>
                  <p><strong className="text-slate-400">IPPIS NUMBER:</strong> {profile.ippisNumber || 'RESTRICTED'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'posting' && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-indigo-400 uppercase text-xs border-b border-slate-800 pb-2">CURRENT POSTING &amp; DEPLOYMENT</h3>
              <div className="space-y-2 text-slate-300">
                <p><strong className="text-slate-400">COMMAND SERVED LAST:</strong> {profile.commandServedLast}</p>
                <p><strong className="text-slate-400">CURRENT DUTY POST:</strong> {profile.dutyPost}</p>
                <p><strong className="text-slate-400">DATE TRANSFERRED TO COMMAND:</strong> {profile.dateTransferred}</p>
                <p><strong className="text-slate-400">ASSIGNED EOD BASE:</strong> {profile.assignedUnit}</p>
              </div>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-cyan-400 uppercase text-xs flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  CBRN &amp; EOD SPECIALIZED TRAINING COURSES
                </h3>

                <button
                  onClick={() => setShowAddTraining(true)}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition flex items-center gap-1.5 uppercase text-[11px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Training</span>
                </button>
              </div>

              {trainings.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No training courses registered for this officer.</p>
              ) : (
                <div className="space-y-3">
                  {trainings.map((t) => (
                    <div key={t.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold block">{t.courseName}</span>
                        <span className="text-slate-400 text-[11px] block mt-0.5">
                          Category: {t.category} • Provider: {t.provider} • Completed: {t.completionDate}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-bold uppercase text-[10px]">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'promotions' && (
            <div className="space-y-4">
              <h3 className="font-bold text-amber-400 uppercase text-xs border-b border-slate-800 pb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                OFFICER RANK PROMOTION HISTORY TIMELINE
              </h3>

              {promotions.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300">
                  <p><strong className="text-slate-400">CURRENT RANK:</strong> {profile.rank}</p>
                  <p><strong className="text-slate-400">DATE OF LAST PROMOTION:</strong> {profile.dateOfLastPromotion}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promotions.map((pr) => (
                    <div key={pr.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold block">
                          Promoted from {pr.previousRank} to {pr.newRank}
                        </span>
                        <span className="text-slate-400 text-[11px] block mt-0.5">
                          Promotion Date: {pr.promotionDate} • Authority: {pr.authority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="font-bold text-indigo-400 uppercase text-xs border-b border-slate-800 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                SECURE OFFICIAL DOCUMENT VAULT (15-MINUTE SIGNED URLS)
              </h3>

              {documents.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No supporting documents uploaded in private vault.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold block">{doc.documentType} - {doc.fileName}</span>
                        <span className="text-slate-400 text-[11px] block mt-0.5">
                          Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewSignedDocument(doc.storagePath)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 text-cyan-300 hover:text-white font-bold transition flex items-center gap-1.5 border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View (15m Signed)</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ADD TRAINING MODAL */}
        {showAddTraining && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-white uppercase text-sm border-b border-slate-800 pb-3">
                REGISTER SPECIALIZED TRAINING COURSE
              </h3>
              <form onSubmit={handleAddTrainingSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">COURSE NAME: *</label>
                  <input
                    type="text"
                    required
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="e.g. Advanced CBRN Mass Spectrometry"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">CATEGORY:</label>
                  <select
                    value={newCourseCategory}
                    onChange={(e) => setNewCourseCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CBRN">CBRN Detection &amp; Protection</option>
                    <option value="EOD">EOD Disposal &amp; Disruptors</option>
                    <option value="Bomb Disposal">Bomb Disposal</option>
                    <option value="Hazmat">Hazmat Response</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">PROVIDER / ACADEMY:</label>
                  <input
                    type="text"
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    placeholder="e.g. NPF EOD Training School Abuja"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">COMPLETION DATE:</label>
                    <input
                      type="date"
                      value={newCompletionDate}
                      onChange={(e) => setNewCompletionDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">EXPIRY DATE:</label>
                    <input
                      type="date"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddTraining(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTraining}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase shadow-lg"
                  >
                    Save Training
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
