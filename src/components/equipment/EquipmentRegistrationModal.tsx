'use client';

import React, { useState, useEffect } from 'react';
import { Radio, ShieldAlert, CheckCircle2, AlertCircle, X, PlusCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EquipmentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EquipmentCategory {
  id: string;
  name: string;
}

export default function EquipmentRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: EquipmentRegistrationModalProps) {
  const supabase = createClient();

  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [userRole, setUserRole] = useState<string>('global_admin');
  const [authorized, setAuthorized] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    assetTag: '',
    name: '',
    categoryId: '',
    serialNumber: '',
    condition: 'serviceable',
    availabilityStatus: 'available',
    operationalStatus: 'operational',
    nextInspectionDate: '',
    nextMaintenanceDate: '',
    quantity: 1,
    unitOfMeasurement: 'PCS',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setSuccessMsg('');
    setErrorMsg('');

    async function checkAuthAndLoadCategories() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          const roles = userRoles?.map((r) => r.role) || [];
          const isAllowed =
            roles.includes('global_admin') ||
            roles.includes('state_admin') ||
            roles.includes('unit_admin') ||
            roles.includes('equipment_officer') ||
            roles.includes('logistics_officer');

          setAuthorized(isAllowed);
          if (roles[0]) setUserRole(roles[0]);
        }

        // Load Categories
        const { data: catList, error: catErr } = await supabase
          .from('equipment_categories')
          .select('id, name')
          .order('name', { ascending: true });

        if (catList && catList.length > 0) {
          setCategories(catList);
          setFormData((prev) => ({ ...prev, categoryId: prev.categoryId || catList[0].id }));
        }
      } catch (err) {
        console.warn('Auth & Category load exception:', err);
      }
    }

    checkAuthAndLoadCategories();
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register button clicked - processing equipment submission');

    if (!authorized) {
      setErrorMsg('You do not have permission to add equipment. Contact the Global Administrator.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Validate mandatory fields
      if (!formData.assetTag.trim()) {
        setErrorMsg('Asset Tag is required.');
        setSubmitting(false);
        return;
      }
      if (!formData.name.trim()) {
        setErrorMsg('Equipment Name is required.');
        setSubmitting(false);
        return;
      }
      if (!formData.serialNumber.trim()) {
        setErrorMsg('Serial Number is required.');
        setSubmitting(false);
        return;
      }
      if (!formData.categoryId) {
        setErrorMsg('Category is required.');
        setSubmitting(false);
        return;
      }

      // Check duplicate Asset Tag
      const { data: existingTag } = await supabase
        .from('equipment_items')
        .select('id')
        .eq('asset_tag', formData.assetTag.trim().toUpperCase())
        .maybeSingle();

      if (existingTag) {
        setErrorMsg('Asset tag already exists.');
        setSubmitting(false);
        return;
      }

      // Check duplicate Serial Number
      const { data: existingSerial } = await supabase
        .from('equipment_items')
        .select('id')
        .eq('serial_number', formData.serialNumber.trim())
        .maybeSingle();

      if (existingSerial) {
        setErrorMsg('Serial number already registered.');
        setSubmitting(false);
        return;
      }

      const payload = {
        asset_tag: formData.assetTag.trim().toUpperCase(),
        name: formData.name.trim(),
        category_id: formData.categoryId,
        serial_number: formData.serialNumber.trim(),
        condition: formData.condition,
        operational_status: formData.operationalStatus,
        availability_status: formData.availabilityStatus,
        quantity: Number(formData.quantity) || 1,
        unit_of_measurement: formData.unitOfMeasurement || 'PCS',
        next_inspection_date: formData.nextInspectionDate || null,
        next_maintenance_date: formData.nextMaintenanceDate || null,
      };

      console.log('Inserting equipment payload into Supabase:', payload);

      const { data, error } = await supabase
        .from('equipment_items')
        .insert(payload)
        .select()
        .single();

      console.log('Database equipment insert response:', { data, error });

      if (error) {
        if (error.message.includes('permission') || error.code === '42501') {
          throw new Error('You do not have permission to add equipment.');
        }
        if (error.message.includes('fetch') || error.code === 'PGRST000') {
          throw new Error('Database connection failed.');
        }
        throw new Error(error.message || 'Failed to register equipment.');
      }

      setSuccessMsg(`Equipment "${formData.name}" (Tag: ${formData.assetTag}) registered successfully!`);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      console.error('Equipment Registration Exception:', err);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono text-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                REGISTER CBRN &amp; EOD EQUIPMENT
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Official NPF EOD CBRN Command Asset Registration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* UNAUTHORIZED PERMISSION WARNING (TASK 6) */}
        {!authorized ? (
          <div className="p-6 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>ACCESS DENIED</span>
            </div>
            <p className="text-xs text-rose-200">
              You are not authorised to register equipment. Contact the Global Administrator.
            </p>
          </div>
        ) : (
          /* REGISTRATION FORM (TASK 8) */
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">ASSET TAG: *</label>
                <input
                  type="text"
                  name="assetTag"
                  required
                  value={formData.assetTag}
                  onChange={handleChange}
                  placeholder="e.g. NPF-EOD-TEST-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">EQUIPMENT NAME: *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. CBRN Detection Unit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">CATEGORY: *</label>
                <select
                  name="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">SERIAL NUMBER: *</label>
                <input
                  type="text"
                  name="serialNumber"
                  required
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="e.g. TEST-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">CONDITION: *</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="serviceable">Serviceable</option>
                  <option value="unserviceable">Unserviceable</option>
                  <option value="under_maintenance">Under Maintenance</option>
                  <option value="decommissioned">Decommissioned</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">AVAILABILITY STATUS: *</label>
                <select
                  name="availabilityStatus"
                  value={formData.availabilityStatus}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="available">Available</option>
                  <option value="issued">Issued</option>
                  <option value="reserved">Reserved</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">NEXT INSPECTION DATE:</label>
                <input
                  type="date"
                  name="nextInspectionDate"
                  value={formData.nextInspectionDate}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">NEXT MAINTENANCE DATE:</label>
                <input
                  type="date"
                  name="nextMaintenanceDate"
                  value={formData.nextMaintenanceDate}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold transition shadow-lg flex items-center gap-2 uppercase tracking-wider"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? 'Registering...' : 'Submit Equipment'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
