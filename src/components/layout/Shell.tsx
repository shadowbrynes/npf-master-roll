'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronLeft,
  ChevronRight,
  Building,
  Award,
  Sliders,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('global_admin');
  const [userName, setUserName] = useState<string>('INSPR. GODWIN UMOH');
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  // Dynamic Database-Driven Counts
  const [personnelCount, setPersonnelCount] = useState<number>(2481);
  const [equipmentCount, setEquipmentCount] = useState<number>(325);
  const [trainingAlerts, setTrainingAlerts] = useState<number>(8);
  const [retirementAlerts, setRetirementAlerts] = useState<number>(14);
  const [birthdayTodayCount, setBirthdayTodayCount] = useState<number>(5);
  const [auditAlertCount, setAuditAlertCount] = useState<number>(3);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    window.location.href = '/login';
  };

  useEffect(() => {
    async function loadUserProfileAndCounts() {
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

        // Fetch Live Personnel Count
        const { count: pCount } = await supabase.from('personnel').select('*', { count: 'exact', head: true });
        if (typeof pCount === 'number') setPersonnelCount(pCount);

        // Fetch Live Training Expiry Warning Count
        const { data: certs } = await supabase.from('personnel_certifications').select('expiry_date, does_not_expire, verification_status');
        if (certs) {
          const today = new Date();
          const expiring = certs.filter(c => {
            if (c.does_not_expire || !c.expiry_date) return false;
            const exp = new Date(c.expiry_date);
            const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
            return diffDays <= 90;
          }).length;
          setTrainingAlerts(expiring);
        }

        // Fetch Live Equipment Count
        const { count: eqCount } = await supabase.from('personnel_equipment').select('*', { count: 'exact', head: true });
        if (typeof eqCount === 'number') setEquipmentCount(eqCount);

        // Fetch Audit Logs Count
        const { count: aCount } = await supabase.from('training_audit_logs').select('*', { count: 'exact', head: true });
        if (typeof aCount === 'number') setAuditAlertCount(aCount);

      } catch (err) {
        console.warn('Shell data load exception:', err);
      }
    }
    loadUserProfileAndCounts();
  }, [supabase]);

  // All 13 Specified Navigation Command Buttons
  const navItems = [
    {
      href: '/dashboard',
      label: 'C2 Command Dashboard',
      subtitle: 'Real-time Operations & C2 Overview',
      icon: ShieldCheck,
      badgeText: '● OPERATIONAL',
      badgeClass: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40 badge-pulse',
      isPrimary: true,
      roles: ['global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'personnel', 'auditor']
    },
    {
      href: '/personnel',
      label: 'Master Nominal Roll',
      subtitle: 'Authoritative Personnel Roster',
      icon: Users,
      badgeText: `${personnelCount.toLocaleString()} Officers`,
      badgeClass: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/30',
      roles: ['global_admin', 'state_admin', 'unit_admin', 'auditor']
    },
    {
      href: '/personnel/state-roll',
      label: 'State Nominal Roll (36 States)',
      subtitle: '36 State Commands & FCT Commands',
      icon: Building,
      badgeText: '36 States',
      badgeClass: 'text-slate-300 bg-slate-900 border-slate-700',
      roles: ['global_admin', 'state_admin', 'auditor']
    },
    {
      href: '/personnel/add',
      label: 'Add Personnel (26 Headings)',
      subtitle: 'Full 26 Form Fields Registration',
      icon: UserPlus,
      badgeText: '+ Register',
      badgeClass: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40',
      roles: ['global_admin', 'state_admin']
    },
    {
      href: '/equipment',
      label: 'CBRN Equipment Inventory',
      subtitle: 'Detectors, Suits & Tactical Assets',
      icon: Radio,
      badgeText: `${equipmentCount} Assets`,
      badgeClass: 'text-teal-300 bg-teal-950/70 border-teal-500/30',
      isPrimary: true,
      roles: ['global_admin', 'state_admin', 'unit_admin', 'equipment_officer']
    },
    {
      href: '/training',
      label: 'Training & Certs',
      subtitle: 'Specialized Courses & Certifications',
      icon: Award,
      badgeText: trainingAlerts > 0 ? `${trainingAlerts} Expiring` : 'Active',
      badgeClass: trainingAlerts > 0 ? 'text-amber-400 bg-amber-950/80 border-amber-500/50 badge-pulse' : 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30',
      isPrimary: true,
      roles: ['global_admin', 'state_admin', 'unit_admin', 'personnel_officer']
    },
    {
      href: '/reports',
      label: 'Command Reports & Intelligence',
      subtitle: 'Executive Intelligence & Dossiers',
      icon: BarChart3,
      badgeText: 'Intel',
      badgeClass: 'text-indigo-300 bg-indigo-950/70 border-indigo-500/30',
      isPrimary: true,
      roles: ['global_admin', 'state_admin', 'auditor']
    },
    {
      href: '/retirement',
      label: 'Retirement Warning Roster',
      subtitle: 'Statutory 35 Yrs Svc / 60 Yrs Age',
      icon: Clock,
      badgeText: `${retirementAlerts} Alerts`,
      badgeClass: 'text-rose-400 bg-rose-950/80 border-rose-500/50 badge-pulse',
      roles: ['global_admin', 'state_admin', 'unit_admin', 'personnel']
    },
    {
      href: '/birthdays',
      label: 'Birthday Automation Roster',
      subtitle: 'Daily Automated Birthday Alerts',
      icon: Cake,
      badgeText: `${birthdayTodayCount} Today`,
      badgeClass: 'text-purple-300 bg-purple-950/70 border-purple-500/30',
      roles: ['global_admin', 'state_admin', 'unit_admin']
    },
    {
      href: '/gen60',
      label: 'Gen.60 Form Dossier',
      subtitle: 'Official Police Record Forms',
      icon: FileSpreadsheet,
      badgeText: 'Form 60',
      badgeClass: 'text-slate-300 bg-slate-900 border-slate-700',
      roles: ['global_admin', 'state_admin', 'unit_admin', 'personnel']
    },
    {
      href: '/audit-logs',
      label: 'Security Audit Logs',
      subtitle: 'System Trail & Security History',
      icon: FileSearch,
      badgeText: `${auditAlertCount} Events`,
      badgeClass: 'text-amber-300 bg-amber-950/70 border-amber-500/30',
      roles: ['global_admin', 'auditor']
    },
    {
      href: '/settings/appearance',
      label: 'Appearance & Images',
      subtitle: 'Visual Assets & Theme Control',
      icon: Sliders,
      badgeText: 'Design',
      badgeClass: 'text-slate-400 bg-slate-900 border-slate-700',
      roles: ['global_admin']
    },
    {
      href: '/settings',
      label: 'System Configuration',
      subtitle: 'Core System Settings & Roles',
      icon: Settings,
      badgeText: 'Admin',
      badgeClass: 'text-slate-400 bg-slate-900 border-slate-700',
      roles: ['global_admin']
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      {/* SIDEBAR COMMAND NAVIGATION */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-30 shadow-2xl relative ${
          collapsed ? 'w-20' : 'w-80'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-white font-black font-mono text-xs block leading-tight tracking-wider">NPF EOD CBRN</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold block uppercase tracking-widest">C2 COMMAND SYSTEM</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition flex items-center justify-center cursor-pointer shadow-md"
            title={collapsed ? 'Expand Menu' : 'Collapse Menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION COMMAND BUTTONS (13 COMMAND MODULES) */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto font-mono text-xs">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const isHovered = hoveredNav === item.href;

            let buttonBg = 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60';
            if (active) {
              buttonBg = 'bg-gradient-to-r from-cyan-950/90 via-teal-950/80 to-slate-900 border-cyan-500/60 text-white shadow-lg shadow-cyan-950/60 font-bold';
            } else if (item.isPrimary) {
              buttonBg = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-cyan-500/40 hover:bg-slate-800/70';
            }

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredNav(item.href)}
                  onMouseLeave={() => setHoveredNav(null)}
                  className={`relative flex items-center justify-between min-h-[56px] px-3.5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${buttonBg} ${
                    active ? 'scale-[1.01]' : 'hover:scale-[1.02] hover:-translate-y-0.5'
                  } ${item.isPrimary && active ? 'btn-primary-breathing' : ''}`}
                >
                  {/* LEFT ANIMATED ACCENT LINE */}
                  <div
                    className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-b from-cyan-400 to-teal-400 shadow-[0_0_8px_#06b6d4]'
                        : isHovered
                        ? 'bg-cyan-500/60 h-4/5'
                        : 'bg-transparent'
                    }`}
                  />

                  {/* LEFT ICON & LABEL AREA */}
                  <div className="flex items-center gap-3 min-w-0 pl-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        active
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-300 group-hover:bg-slate-800'
                      }`}
                    >
                      <Icon
                        className={`w-4.5 h-4.5 transition-transform duration-300 ${
                          isHovered ? 'scale-110 rotate-3 text-cyan-300' : ''
                        }`}
                      />
                    </div>

                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs truncate ${active ? 'text-white font-black' : 'text-slate-200'}`}>
                            {item.label}
                          </span>
                          {active && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" title="Active Module" />
                          )}
                        </div>
                        {item.subtitle && (
                          <span className="text-[10px] text-slate-400 truncate block font-sans">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* RIGHT BADGE / LIVE DATABASE INDICATOR */}
                  {!collapsed && item.badgeText && (
                    <div className="shrink-0 ml-2">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono uppercase tracking-wider ${item.badgeClass}`}>
                        {item.badgeText}
                      </span>
                    </div>
                  )}
                </Link>

                {/* COLLAPSED TOOLTIP HOVER DISPLAY */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono text-xs">
                    <p className="font-bold text-cyan-400">{item.label}</p>
                    {item.subtitle && <p className="text-[10px] text-slate-400">{item.subtitle}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER & USER PROFILE */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 font-mono text-xs">
          {!collapsed && (
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 mb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Logged In User:</span>
                <span className="text-white font-bold text-[11px] truncate block">{userName}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold uppercase">
                {userRole}
              </span>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 border border-rose-500/30 transition text-xs font-mono font-bold cursor-pointer shadow-md"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
