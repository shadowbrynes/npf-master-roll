import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET /api/retirement-policies
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('retirement_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[GET RETIREMENT POLICIES ERROR]', error);
        return res.status(500).json({ success: false, message: 'Could not fetch retirement policies.', error: error.message });
      }

      return res.status(200).json({
        success: true,
        count: (data || []).length,
        data: data || []
      });
    } catch (err) {
      console.error('[GET /api/retirement-policies EXCEPTION]', err);
      return res.status(500).json({ success: false, message: 'Exception fetching retirement policies.' });
    }
  }

  // 2. POST /api/retirement-policies (Global Admin)
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const headers = req.headers || {};
      const userRole = headers['x-user-role'] || (req.body && req.body.userRole) || 'GLOBAL_ADMIN';

      if (userRole !== 'GLOBAL_ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'super_admin' && userRole !== 'global_admin') {
        return res.status(403).json({ success: false, message: 'Only Global Administrators can configure retirement policies.' });
      }

      const body = req.body || {};
      const { policyName, retirementAge, maximumServiceYears, noticeMonths, active } = body;

      const age = parseInt(retirementAge || 60, 10);
      const service = parseInt(maximumServiceYears || 35, 10);
      const notice = parseInt(noticeMonths || 2, 10);

      if (!policyName || isNaN(age) || isNaN(service)) {
        return res.status(400).json({ success: false, message: 'Policy Name, Retirement Age, and Max Service Years are required.' });
      }

      const payload = {
        policy_name: policyName,
        retirement_age: age,
        maximum_service_years: service,
        notice_months: notice,
        active: active !== false
      };

      const { data, error } = await supabase
        .from('retirement_policies')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('[POST RETIREMENT POLICY ERROR]', error);
        return res.status(500).json({ success: false, message: 'Could not save retirement policy.', error: error.message });
      }

      return res.status(201).json({
        success: true,
        message: 'Retirement policy created successfully.',
        data
      });
    } catch (err) {
      console.error('[POST /api/retirement-policies EXCEPTION]', err);
      return res.status(500).json({ success: false, message: 'Exception saving retirement policy.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
