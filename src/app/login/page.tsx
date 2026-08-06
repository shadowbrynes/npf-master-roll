'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        setError('Please provide your authorized official NPF email and password.');
        setLoading(false);
        return;
      }

      // Step 1: Validate credentials with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      const user = authData?.user;

      if (authError || !user) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AUTH DEBUG - SIGN IN FAILED]', { user, authError });
        }
        setError(authError?.message || 'Invalid login credentials');
        setLoading(false);
        return;
      }

      // Step 2: Query roles table for user permission
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Step 3: Fallback query to profiles table if needed
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH DEBUG - SUCCESS LOG]', {
          user,
          userId: user.id,
          authError,
          roleData,
          roleError,
          profileData,
          profileError,
          redirectDecision: roleData?.role || profileData?.role ? '/dashboard' : 'UNAUTHORIZED'
        });
      }

      const assignedRole = roleData?.role || profileData?.role;

      // Step 4: Check user permission & role authorization
      if (!assignedRole) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[AUTH DEBUG - UNAUTHORIZED ROLE]', { userId: user.id });
        }
        setError('Your account exists but has not been authorised for this portal. Contact a Global Administrator.');
        setLoading(false);
        return;
      }

      // Standardized role check: global_admin, base_admin, unit_admin, personnel_officer, viewer
      const validRoles = ['global_admin', 'base_admin', 'unit_admin', 'personnel_officer', 'viewer', 'super_admin'];
      const normalizedRole = assignedRole.toLowerCase();

      if (!validRoles.includes(normalizedRole)) {
        setError('Your account exists but has not been authorised for this portal. Contact a Global Administrator.');
        setLoading(false);
        return;
      }

      // Step 5: Successful Auth & Authorization -> Load Dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed.';
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AUTH DEBUG - EXCEPTION]', err);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/50">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
            NIGERIA POLICE FORCE EOD CBRN
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Personnel &amp; CBRN Equipment C2 Management Portal
          </p>
          <div className="mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-400" />
            Restricted Law Enforcement System
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 font-mono text-xs">
          <div>
            <label className="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
              Official Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@npf.gov.ng"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
              Authorization Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {loading ? 'Authenticating Credentials...' : 'Secure Administrator Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            Public registration is strictly disabled. Accounts must be invited by an authorized Global Administrator. Unauthorized access attempts are monitored and recorded.
          </p>
        </div>
      </div>
    </div>
  );
}
