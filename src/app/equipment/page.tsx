'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/layout/Shell';
import EquipmentRegistrationModal from '@/components/equipment/EquipmentRegistrationModal';
import { Radio, PlusCircle, Search, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RealEquipmentItem {
  id: string;
  assetTag: string;
  name: string;
  categoryName: string;
  serialNumber: string;
  condition: string;
  operationalStatus: string;
  availabilityStatus: string;
  nextInspectionDate: string;
  nextMaintenanceDate: string;
  createdAt: string;
}

export default function EquipmentPage() {
  const supabase = createClient();
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [equipmentList, setEquipmentList] = useState<RealEquipmentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchEquipmentInventory = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('equipment_items')
        .select(`
          *,
          equipment_categories (name)
        `)
        .order('created_at', { ascending: false });

      console.log('Equipment Inventory Query Result:', { data, error });

      if (error) {
        throw new Error(error.message || 'Database connection failed.');
      }

      if (data) {
        const mapped: RealEquipmentItem[] = data.map((item: any) => ({
          id: item.id,
          assetTag: item.asset_tag || '',
          name: item.name || '',
          categoryName: item.equipment_categories?.name || item.category_name || 'General Equipment',
          serialNumber: item.serial_number || '',
          condition: item.condition || 'serviceable',
          operationalStatus: item.operational_status || 'operational',
          availabilityStatus: item.availability_status || 'available',
          nextInspectionDate: item.next_inspection_date || '-',
          nextMaintenanceDate: item.next_maintenance_date || '-',
          createdAt: item.created_at || '',
        }));

        setEquipmentList(mapped);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database connection failed.';
      console.error('Fetch Inventory Exception:', err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEquipmentInventory();
  }, [fetchEquipmentInventory]);

  const filteredEquipment = equipmentList.filter(
    (eq) =>
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterClick = () => {
    console.log('Register button clicked - opening modal');
    setShowRegisterModal(true);
  };

  return (
    <Shell>
      <div className="space-y-6 font-mono text-xs">
        {/* HEADER HERO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                CBRN &amp; EOD EQUIPMENT INVENTORY MANAGEMENT
              </h1>
              <p className="text-slate-400 mt-1">
                National Inventory • Custody Tracking • Live Supabase PostgreSQL Integration ({filteredEquipment.length} Items)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchEquipmentInventory}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-2 font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* REGISTER BUTTON WITH WORKING ONCLICK EVENT HANDLER */}
            <button
              onClick={handleRegisterClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white transition flex items-center gap-2 font-bold uppercase shadow-lg shadow-indigo-950/50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Equipment</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SEARCH TOOLBAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Asset Tag, Equipment Name, Serial No..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* EQUIPMENT TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3 border-r border-slate-800/60 text-indigo-400">ASSET TAG</th>
                  <th className="p-3 border-r border-slate-800/60 text-white">EQUIPMENT NAME</th>
                  <th className="p-3 border-r border-slate-800/60">CATEGORY</th>
                  <th className="p-3 border-r border-slate-800/60">SERIAL NO.</th>
                  <th className="p-3 border-r border-slate-800/60 text-emerald-400">CONDITION</th>
                  <th className="p-3 border-r border-slate-800/60 text-cyan-400">STATUS</th>
                  <th className="p-3 text-amber-400">NEXT MAINTENANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      Loading equipment inventory from Supabase...
                    </td>
                  </tr>
                ) : filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      No equipment records found in database. Click &quot;Register Equipment&quot; to add items.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 border-r border-slate-800/60 font-bold text-indigo-300">{item.assetTag}</td>
                      <td className="p-3 border-r border-slate-800/60 font-bold text-white">{item.name}</td>
                      <td className="p-3 border-r border-slate-800/60 text-slate-300">{item.categoryName}</td>
                      <td className="p-3 border-r border-slate-800/60 text-slate-400">{item.serialNumber}</td>
                      <td className="p-3 border-r border-slate-800/60">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                          {item.condition}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-800/60">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                          {item.availabilityStatus}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-300">{item.nextMaintenanceDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* REGISTRATION MODAL */}
        <EquipmentRegistrationModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={fetchEquipmentInventory}
        />
      </div>
    </Shell>
  );
}
