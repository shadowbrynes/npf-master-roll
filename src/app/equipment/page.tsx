'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import { Radio, PlusCircle, Search, ShieldCheck } from 'lucide-react';
import { EquipmentItem } from '@/types';

export default function EquipmentPage() {
  const demoEquipment: EquipmentItem[] = [
    {
      id: 'eq-1',
      assetTag: 'NPF-EOD-DIS-001',
      name: 'EOD Tactical Bomb Suit MK5',
      categoryId: 'cat-1',
      categoryName: 'EOD Disruptors & Bomb Suits',
      serialNumber: 'SN-SUIT-99881',
      condition: 'serviceable',
      operationalStatus: 'operational',
      availabilityStatus: 'available',
      nextInspectionDate: '2026-11-01',
      nextMaintenanceDate: '2026-12-15',
    },
    {
      id: 'eq-2',
      assetTag: 'NPF-CBRN-DET-042',
      name: 'CBRN Chemical Agent Monitor (CAM)',
      categoryId: 'cat-2',
      categoryName: 'CBRN Detectors & Mass Spectrometers',
      serialNumber: 'SN-CAM-44102',
      condition: 'serviceable',
      operationalStatus: 'operational',
      availabilityStatus: 'issued',
      nextInspectionDate: '2026-09-20',
      nextMaintenanceDate: '2026-10-10',
    },
  ];

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
                National Inventory • Custody Tracking • Maintenance &amp; Calibration Schedule
              </p>
            </div>
          </div>

          <button className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 font-bold uppercase shadow-lg shadow-indigo-950/50">
            <PlusCircle className="w-4 h-4" />
            <span>Register Equipment</span>
          </button>
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
                {demoEquipment.map((item) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
