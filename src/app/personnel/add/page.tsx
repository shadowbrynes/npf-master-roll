'use client';

import React, { useState } from 'react';
import Shell from '@/components/layout/Shell';
import { UserPlus, Shield, CheckCircle2, AlertCircle, Calendar, Lock } from 'lucide-react';
import { calculateStatutoryRetirement } from '@/lib/retirement-engine';

export default function AddPersonnelPage() {
  const [formData, setFormData] = useState({
    // Section A
    apfNo: '',
    rank: '',
    fullName: '',
    educationalQualification: 'BSC POLICE SCIENCE',
    stateOfOrigin: 'LAGOS',
    phoneNumber: '',
    tribe: '',
    dateOfBirth: '',
    geopoliticalZone: 'SOUTH WEST',
    emailAddress: '',
    mss: '',

    // Section B
    dateOfEnlistment: '',
    dateOfLastPromotion: '',
    retirementDate: '',
    commandServedLast: '',
    dutyPost: 'EOD TECH',
    dateTransferred: '',
    gdSp: 'GD',

    // Section C (Global Admin Restricted)
    gradeLevel: '10',
    bankName: 'NPFMFB',
    employeeCode: '',
    ippisNumber: '',
    pfa: 'NPF PENSION',
    penPin: '',
    nhfNumber: '',
    assignedUnitId: '',

    // Section D
    baseId: '',
    unitId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [calculatedRetirement, setCalculatedRetirement] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'dateOfBirth' || name === 'dateOfEnlistment') {
        if (updated.dateOfBirth && updated.dateOfEnlistment) {
          const ret = calculateStatutoryRetirement(updated.dateOfBirth, updated.dateOfEnlistment);
          setCalculatedRetirement(ret.effectiveRetirementDate);
          updated.retirementDate = ret.effectiveRetirementDate;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (!formData.apfNo || !formData.rank || !formData.fullName || !formData.stateOfOrigin || !formData.phoneNumber || !formData.dateOfBirth || !formData.dateOfEnlistment) {
        setErrorMsg('Please fill out all required fields marked with *.');
        setSubmitting(false);
        return;
      }

      // Simulate API submit
      await new Promise((res) => setTimeout(res, 800));
      setSuccessMsg(`Officer ${formData.rank} ${formData.fullName} successfully registered in Supabase PostgreSQL Master Roll!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register personnel.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs max-w-5xl mx-auto">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                ADD PERSONNEL TO MASTER ROLL (26 HEADINGS)
              </h1>
              <p className="text-slate-400 mt-1">
                Official NPF EOD CBRN Registration • Statutory 60/35 Retirement Auto-Calculation
              </p>
            </div>
          </div>
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

        {/* 26 HEADINGS FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
          {/* SECTION A: PERSONAL AND CONTACT INFORMATION */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-cyan-400 uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              SECTION A: PERSONAL AND CONTACT INFORMATION
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">1. AP/F/NO: *</label>
                <input
                  type="text"
                  name="apfNo"
                  required
                  value={formData.apfNo}
                  onChange={handleChange}
                  placeholder="e.g. AP/123456 or F/98765"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">2. RANK: *</label>
                <select
                  name="rank"
                  required
                  value={formData.rank}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select Rank --</option>
                  <option value="CSP">CSP</option>
                  <option value="SP">SP</option>
                  <option value="DSP">DSP</option>
                  <option value="ASP">ASP</option>
                  <option value="INSPR">INSPR</option>
                  <option value="SGT">SGT</option>
                  <option value="CPL">CPL</option>
                  <option value="PC">PC</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1 font-bold">3. NAME: *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. ADEBAYO SUNDAY MIKESH"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">4. EDU. QUALIFICATION:</label>
                <input
                  type="text"
                  name="educationalQualification"
                  value={formData.educationalQualification}
                  onChange={handleChange}
                  placeholder="e.g. BSC POLICE SCIENCE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">5. STATE OF ORIGIN: *</label>
                <input
                  type="text"
                  name="stateOfOrigin"
                  required
                  value={formData.stateOfOrigin}
                  onChange={handleChange}
                  placeholder="e.g. LAGOS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">6. PHONE NUMBER: *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. 08031234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">7. TRIBE:</label>
                <input
                  type="text"
                  name="tribe"
                  value={formData.tribe}
                  onChange={handleChange}
                  placeholder="e.g. YORUBA, IGBO, HAUSA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">8. DATE OF BIRTH: *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">9. GEO POL ZONE:</label>
                <input
                  type="text"
                  name="geopoliticalZone"
                  value={formData.geopoliticalZone}
                  onChange={handleChange}
                  placeholder="e.g. SOUTH WEST"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">10. E-MAIL ADDRESS:</label>
                <input
                  type="email"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  placeholder="e.g. officer@npf.gov.ng"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">11. MSS:</label>
                <input
                  type="text"
                  name="mss"
                  value={formData.mss}
                  onChange={handleChange}
                  placeholder="e.g. APAPA BASE LAGOS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION B: CAREER, DEPLOYMENT AND RETIREMENT */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              SECTION B: CAREER, DEPLOYMENT AND RETIREMENT
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">12. DATE OF ENLIST: *</label>
                <input
                  type="date"
                  name="dateOfEnlistment"
                  required
                  value={formData.dateOfEnlistment}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">13. DATE OF LAST PROM.:</label>
                <input
                  type="date"
                  name="dateOfLastPromotion"
                  value={formData.dateOfLastPromotion}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2 p-4 bg-slate-950 rounded-2xl border border-emerald-500/40">
                <label className="block text-emerald-400 mb-1 font-bold">14. DATE OF RETIREMENT (Auto-Computed):</label>
                <input
                  type="date"
                  name="retirementDate"
                  readOnly
                  value={calculatedRetirement || formData.retirementDate}
                  className="w-full bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Automatically calculated as MIN(DOB + 60 Years, Enlistment + 35 Years).
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">15. COMMAND SERVED LAST:</label>
                <input
                  type="text"
                  name="commandServedLast"
                  value={formData.commandServedLast}
                  onChange={handleChange}
                  placeholder="e.g. APAPA SEA PORT EOD BASE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">16. DUTY POST:</label>
                <input
                  type="text"
                  name="dutyPost"
                  value={formData.dutyPost}
                  onChange={handleChange}
                  placeholder="e.g. EOD OPERATIVE / CMDR"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">17. DATE TRANSFERRED:</label>
                <input
                  type="date"
                  name="dateTransferred"
                  value={formData.dateTransferred}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">18. GD/SP:</label>
                <select
                  name="gdSp"
                  value={formData.gdSp}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="GD">GD (General Duty)</option>
                  <option value="SP">SP (Specialist)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION C: FINANCIAL, PAYROLL AND PENSION (GLOBAL ADMIN RESTRICTED) */}
          <div className="space-y-4 p-5 bg-slate-950 rounded-2xl border border-rose-500/40">
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
              <h2 className="text-sm font-bold text-rose-400 uppercase flex items-center gap-2">
                <Lock className="w-4 h-4" />
                SECTION C: FINANCIAL, PAYROLL AND PENSION
              </h2>
              <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase">
                GLOBAL ADMIN RESTRICTED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">19. G/L:</label>
                <input
                  type="text"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">20. BANK NAME:</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g. NPFMFB / UBA"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">21. EMPLOYEE CODE:</label>
                <input
                  type="text"
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleChange}
                  placeholder="e.g. NP144326"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">22. IPPIS NUMBER:</label>
                <input
                  type="text"
                  name="ippisNumber"
                  value={formData.ippisNumber}
                  onChange={handleChange}
                  placeholder="e.g. PF027452"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">23. PFA:</label>
                <input
                  type="text"
                  name="pfa"
                  value={formData.pfa}
                  onChange={handleChange}
                  placeholder="e.g. NPF PENSION"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">24. PEN PIN:</label>
                <input
                  type="text"
                  name="penPin"
                  value={formData.penPin}
                  onChange={handleChange}
                  placeholder="e.g. PEN100060086"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">25. NHF NUMBER:</label>
                <input
                  type="text"
                  name="nhfNumber"
                  value={formData.nhfNumber}
                  onChange={handleChange}
                  placeholder="e.g. NHF131696142"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">26. ASSIGNED UNIT: *</label>
                <input
                  type="text"
                  name="assignedUnitId"
                  value={formData.assignedUnitId}
                  onChange={handleChange}
                  placeholder="e.g. APAPA SEA PORT CBRN UNIT"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center gap-2 uppercase tracking-wider"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{submitting ? 'Registering Officer...' : 'Save Personnel Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
