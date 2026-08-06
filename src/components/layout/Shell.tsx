'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Users,
  UserPlus,
  Radio,
  Clock,
  Cake,
  FileText,
  FileSearch,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';
import { UserRole } from '@/types';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('global_admin');

  const navItems = [
    { href: '/dashboard', label: 'C2 Command Dashboard', icon: Shield, roles: ['global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'personnel', 'auditor'] },
    { href: '/personnel', label: 'Master Nominal Roll', icon: Users, roles: ['global_admin', 'state_admin', 'unit_admin', 'auditor'] },
    { href: '/personnel/add', label: 'Add Personnel (26 Headings)', icon: UserPlus, roles: ['global_admin', 'state_admin'] },
    { href: '/equipment', label: 'CBRN Equipment Inventory', icon: Radio, roles: ['global_admin', 'state_admin', 'unit_admin', 'equipment_officer'] },
    { href: '/retirement', label: 'Retirement Warning Roster', icon: Clock, roles: ['global_admin', 'state_admin', 'unit_admin', 'personnel'] },
    { href: '/birthdays', label: 'Birthday Automation Roster', icon: Cake, roles: ['global_admin', 'state_admin', 'unit_admin'] },
    { href: '/gen60', label: 'Gen.60 Form Dossier', icon: FileText, roles: ['global_admin', 'state_admin', 'unit_admin', 'personnel'] },
    { href: '/audit-logs', label: 'Security Audit Logs', icon: FileSearch, roles: ['global_admin', 'auditor'] },
    { href: '/settings', label: 'System Configuration', icon: Settings, roles: ['global_admin'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-20 ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider">NPF EOD CBRN</h2>
                <p className="text-[10px] text-slate-400 font-mono">National C2 System</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition mx-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto font-mono text-xs">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* USER ROLE SWITCHER DEMO FOOTER */}
        <div className="p-3 border-t border-slate-800 font-mono text-[11px] space-y-2">
          {!collapsed && (
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">ACTIVE ROLE CONTEXT:</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-800 text-cyan-300 rounded-lg px-2 py-1 text-[11px] focus:outline-none cursor-pointer mt-1"
              >
                <option value="global_admin">Global Administrator</option>
                <option value="state_admin">State Base Administrator</option>
                <option value="unit_admin">Tactical Unit Administrator</option>
                <option value="equipment_officer">Equipment Store Officer</option>
                <option value="personnel">Personnel Self-Service</option>
                <option value="auditor">Auditor (Read-Only)</option>
              </select>
            </div>
          )}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full p-2 rounded-xl bg-slate-800 text-rose-400 hover:bg-rose-950 transition font-bold"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>SIGN OUT</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP APP HEADER */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between z-10 font-mono text-xs">
          <div className="flex items-center gap-3">
            <Building className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-white font-bold uppercase tracking-wider block">
                NATIONAL EOD CBRN COMMAND HEADQUARTERS
              </span>
              <span className="text-[10px] text-slate-400">
                SUPABASE PRODUCTION POSTGRESQL ENGINE • AUTHORITATIVE ROLL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center font-bold text-cyan-300">
                DA
              </div>
              <div className="text-right">
                <span className="text-white font-bold block uppercase">CSP DESMOND AGBALA</span>
                <span className="text-[10px] text-amber-400 uppercase font-bold">{userRole.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
