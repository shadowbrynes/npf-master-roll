'use client';

import React, { useState, useEffect } from 'react';
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
  Building,
  Sliders
} from 'lucide-react';
import { UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('global_admin');
  const [userName, setUserName] = useState<string>('INSPR. GODWIN UMOH');

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
          if (metaName) setUserName(metaName);

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.full_name) setUserName(profile.full_name);
          if (profile?.role) setUserRole(profile.role as UserRole);
        }
      } catch (err) {
        console.warn('Shell profile load error:', err);
      }
    }
    loadUserProfile();
  }, [supabase]);

  const navItems = [
    { href: '/dashboard', label: 'C2 Command Dashboard', icon: Shield, roles: ['global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'personnel', 'auditor'] },
    { href: '/personnel', label: 'Master Nominal Roll', icon: Users, roles: ['global_admin', 'state_admin', 'unit_admin', 'auditor'] },
    { href: '/personnel/state-roll', label: 'State Nominal Roll (36 States)', icon: Building, roles: ['global_admin', 'state_admin', 'auditor'] },
    { href: '/personnel/add', label: 'Add Personnel (26 Headings)', icon: UserPlus, roles: ['global_admin', 'state_admin'] },
    { href: '/equipment', label: 'CBRN Equipment Inventory', icon: Radio, roles: ['global_admin', 'state_admin', 'unit_admin', 'equipment_officer'] },
    { href: '/retirement', label: 'Retirement Warning Roster', icon: Clock, roles: ['global_admin', 'state_admin', 'unit_admin', 'personnel'] },
    { href: '/birthdays', label: 'Birthday Automation Roster', icon: Cake, roles: ['global_admin', 'state_admin', 'unit_admin'] },
    { href: '/gen60', label: 'Gen.60 Form Dossier', icon: FileText, roles: ['global_admin', 'state_admin', 'unit_admin', 'personnel'] },
    { href: '/audit-logs', label: 'Security Audit Logs', icon: FileSearch, roles: ['global_admin', 'auditor'] },
    { href: '/settings/appearance', label: 'Appearance & Images', icon: Sliders, roles: ['global_admin'] },
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
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-white font-bold font-mono text-xs block leading-tight">NPF EOD CBRN</span>
                <span className="text-[10px] text-cyan-400 font-mono block">C2 MANAGEMENT PORTAL</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-xs font-mono font-medium ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-3 border-t border-slate-800">
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 transition text-xs font-mono font-bold"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 font-mono">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>NPF EOD CBRN COMMAND HEADQUARTERS</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            {/* USER PROFILE CARD - INSPR. GODWIN UMOH */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center font-bold text-cyan-300 text-xs">
                GU
              </div>
              <div className="text-right">
                <span className="text-white font-bold block uppercase">{userName}</span>
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
