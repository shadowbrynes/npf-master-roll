import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    const twoMonthsStr = twoMonthsLater.toISOString().split('T')[0];

    const [
      { count: totalPersonnel, error: pErr },
      { count: activeOfficers, error: actErr },
      { count: totalBases, error: bErr },
      { count: totalUnits, error: uErr },
      { count: retiringNextTwoMonths, error: rTwoErr },
      { count: dueOrOverdue, error: rDueErr }
    ] = await Promise.all([
      supabase.from('personnel').select('*', { count: 'exact', head: true }),
      supabase.from('personnel').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bases').select('*', { count: 'exact', head: true }),
      supabase.from('units').select('*', { count: 'exact', head: true }),
      supabase.from('personnel').select('*', { count: 'exact', head: true }).gte('retirement_date', todayStr).lte('retirement_date', twoMonthsStr),
      supabase.from('personnel').select('*', { count: 'exact', head: true }).lt('retirement_date', todayStr)
    ]);

    if (pErr || actErr || bErr || uErr || rTwoErr || rDueErr) {
      const firstErr = pErr || actErr || bErr || uErr || rTwoErr || rDueErr;
      console.error('[SUPABASE DASHBOARD QUERY ERROR]', firstErr);
      return res.status(500).json({
        success: false,
        message: 'Dashboard statistics could not be loaded from the database.',
        error: firstErr.message
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalPersonnel: totalPersonnel || 0,
        totalBases: totalBases || 0,
        totalUnits: totalUnits || 0,
        activeOfficers: activeOfficers || 0,
        retiringNextTwoMonths: retiringNextTwoMonths || 0,
        dueOrOverdue: dueOrOverdue || 0,
        source: 'SUPABASE'
      }
    });

  } catch (err) {
    console.error('[GET /api/dashboard EXCEPTION]', err);
    return res.status(500).json({ success: false, message: 'Dashboard statistics could not be loaded.' });
  }
}
