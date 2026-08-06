import { supabase } from './_supabase.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const userRole = req.headers['x-user-role'] || (req.body && req.body.userRole) || '';
  if (userRole !== 'GLOBAL_ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Only Super Administrators can execute database seed migration.' });
  }

  const body = req.body || {};
  if (body.confirm !== true && body.confirm !== 'true') {
    return res.status(400).json({ success: false, message: 'Explicit confirmation required. Send { confirm: true }.' });
  }

  try {
    let insertedCount = 0;

    // Seed Bases
    const basesData = [
      { id: '11111111-1111-4111-a111-111111111111', base_code: 'EOD-HQ-00', base_name: 'NATIONAL EOD-CBRN COMMAND HEADQUARTERS, ABUJA', location: 'ABUJA', state: 'FCT', status: 'ACTIVE' },
      { id: '22222222-2222-4222-a222-222222222222', base_code: 'EOD-BASE-01', base_name: 'APAPA SEA PORT EOD-CBRN TACTICAL BASE', location: 'LAGOS', state: 'LAGOS', status: 'ACTIVE' }
    ];

    for (const b of basesData) {
      await supabase.from('bases').upsert(b, { onConflict: 'id' });
      insertedCount++;
    }

    // Seed Units
    const unitsData = [
      { id: '33333333-3333-4333-a333-333333333333', unit_code: 'OPS-01', unit_name: 'OPERATIONS UNIT', base_id: '22222222-2222-4222-a222-222222222222', command_name: 'NATIONAL COMMAND', location: 'LAGOS', description: 'Tactical EOD response unit', status: 'ACTIVE' },
      { id: '44444444-4444-4444-a444-444444444444', unit_code: 'INT-02', unit_name: 'INTELLIGENCE & ANALYSIS UNIT', base_id: '11111111-1111-4111-a111-111111111111', command_name: 'NATIONAL COMMAND', location: 'ABUJA', description: 'Chemical intelligence unit', status: 'ACTIVE' }
    ];

    for (const u of unitsData) {
      await supabase.from('units').upsert(u, { onConflict: 'id' });
      insertedCount++;
    }

    // Audit Log with correct schema columns
    try {
      await supabase.from('audit_logs').insert({
        id: crypto.randomUUID(),
        actor_uid: null,
        actor_role: userRole,
        action: 'EXECUTE_MIGRATION',
        entity_type: 'DATABASE',
        entity_id: null,
        result: 'SUCCESS',
        created_at: new Date().toISOString()
      });
    } catch (aErr) {
      console.warn('[AUDIT LOG INSERT WARNING]', aErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase database seed migration completed successfully.',
      migratedCount: insertedCount
    });

  } catch (err) {
    console.error('[SUPABASE MIGRATION ERROR]', err);
    return res.status(500).json({ success: false, message: 'Migration failed: ' + err.message });
  }
}
