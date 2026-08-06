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
    const { data: personnelList, error } = await supabase
      .from('personnel')
      .select('id, apf_no, full_name, rank, retirement_date, date_of_birth, date_of_enlistment, base_id, unit_id');

    if (error) {
      console.error('[SUPABASE RETIREMENT PROJECTIONS ERROR]', error);
      return res.status(500).json({ success: false, message: 'Retirement projections could not be retrieved.', error: error.message });
    }

    const today = new Date();
    const buckets = {
      dueOrOverdue: [],
      m0to2: [],
      m3to4: [],
      m5to6: [],
      m7to8: [],
      m9to10: [],
      m11to12: [],
      mMoreThan12: []
    };

    (personnelList || []).forEach(p => {
      const rDateStr = p.retirement_date || p.retire_date;
      if (!rDateStr) return;

      const rDate = new Date(rDateStr);
      const diffMonths = (rDate.getFullYear() - today.getFullYear()) * 12 + (rDate.getMonth() - today.getMonth());

      const item = {
        id: p.id,
        apfNo: p.apf_no || p.ap_no,
        fullName: p.full_name || p.name,
        rank: p.rank,
        retirementDate: rDateStr,
        diffMonths
      };

      if (rDate < today) {
        buckets.dueOrOverdue.push(item);
      } else if (diffMonths >= 0 && diffMonths <= 2) {
        buckets.m0to2.push(item);
      } else if (diffMonths >= 3 && diffMonths <= 4) {
        buckets.m3to4.push(item);
      } else if (diffMonths >= 5 && diffMonths <= 6) {
        buckets.m5to6.push(item);
      } else if (diffMonths >= 7 && diffMonths <= 8) {
        buckets.m7to8.push(item);
      } else if (diffMonths >= 9 && diffMonths <= 10) {
        buckets.m9to10.push(item);
      } else if (diffMonths >= 11 && diffMonths <= 12) {
        buckets.m11to12.push(item);
      } else {
        buckets.mMoreThan12.push(item);
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          dueOrOverdueCount: buckets.dueOrOverdue.length,
          m0to2Count: buckets.m0to2.length,
          m3to4Count: buckets.m3to4.length,
          m5to6Count: buckets.m5to6.length,
          m7to8Count: buckets.m7to8.length,
          m9to10Count: buckets.m9to10.length,
          m11to12Count: buckets.m11to12.length,
          mMoreThan12Count: buckets.mMoreThan12.length
        },
        buckets,
        source: 'SUPABASE'
      }
    });

  } catch (err) {
    console.error('[GET /api/retirement-projections EXCEPTION]', err);
    return res.status(500).json({ success: false, message: 'Retirement projections could not be loaded.' });
  }
}
