import { supabase } from './_supabase.js';
import crypto from 'crypto';

function normaliseBaseCode(value) {
  let text = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-+/g, '-');
  
  if (text && !text.startsWith('BASE-') && !text.startsWith('EOD-')) {
    text = `BASE-${text}`;
  }
  return text;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET /api/bases
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('bases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SUPABASE GET BASES ERROR]', error);
        return res.status(500).json({ success: false, message: 'Bases could not be retrieved from the database.', error: error.message });
      }

      const formatted = (data || []).map(b => ({
        id: b.id,
        baseCode: b.base_code || b.baseCode || '',
        base_code: b.base_code || b.baseCode || '',
        baseName: b.base_name || b.baseName || '',
        base_name: b.base_name || b.baseName || '',
        location: b.location || 'NIGERIA',
        state: b.state || 'NIGERIA',
        status: b.status || 'active',
        createdAt: b.created_at,
        updatedAt: b.updated_at
      }));

      return res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted,
        source: "SUPABASE"
      });
    } catch (err) {
      console.error('[GET /api/bases EXCEPTION]', err);
      return res.status(500).json({ success: false, message: 'Bases could not be retrieved from the database.' });
    }
  }

  // 2. POST /api/bases
  if (req.method === 'POST') {
    try {
      const headers = req.headers || {};
      const authHeader = headers['authorization'] || '';
      let userRole = headers['x-user-role'] || (req.body && req.body.userRole) || 'GLOBAL_ADMIN';

      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: authUser } = await supabase.auth.getUser(token);
        if (authUser && authUser.user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', authUser.user.id).maybeSingle();
          if (profile && profile.role) {
            userRole = profile.role.toUpperCase();
          }
        }
      }

      const authorizedRoles = ['GLOBAL_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'RECORDS_ADMIN', 'SYSTEM_ADMINISTRATOR', 'PERSONNEL_ADMINISTRATOR', 'super_admin', 'system_admin', 'personnel_admin'];
      if (!authorizedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to add a base.'
        });
      }

      const body = req.body || {};
      const rawCode = body.baseCode || body.base_code || '';
      const rawName = body.baseName || body.base_name || '';

      const normalisedBaseCode = normaliseBaseCode(rawCode);
      const baseName = String(rawName).trim().toUpperCase();

      const errors = {};
      if (!normalisedBaseCode) {
        errors.baseCode = 'Base Code is required.';
      } else if (!/^[A-Z0-9-]{1,50}$/.test(normalisedBaseCode)) {
        errors.baseCode = 'Please enter a valid Base Code (e.g. BASE-38 or 38).';
      }

      if (!baseName) {
        errors.baseName = 'Base Name is required.';
      }

      if (Object.keys(errors).length > 0) {
        const firstMsg = errors.baseCode || errors.baseName || 'Validation failed.';
        return res.status(400).json({ success: false, message: firstMsg, errors });
      }

      // Check existing duplicate Base Code in Supabase
      const { data: existingBase, error: dupCheckErr } = await supabase
        .from('bases')
        .select('id')
        .eq('base_code', normalisedBaseCode)
        .maybeSingle();

      if (dupCheckErr) {
        console.error('[SUPABASE BASE DUP CHECK ERROR]', dupCheckErr);
        return res.status(500).json({ success: false, message: 'Error checking base uniqueness in database.', error: dupCheckErr.message });
      }

      if (existingBase) {
        return res.status(409).json({
          success: false,
          message: `Base Code ${normalisedBaseCode} already exists.`,
          errors: { baseCode: `Base Code ${normalisedBaseCode} already exists.` }
        });
      }

      const baseCode = normalisedBaseCode;
      const payload = {
        id: crypto.randomUUID(),
        base_code: baseCode,
        base_name: baseName,
        location: (body.location || body.state || 'NIGERIA').toString().trim().toUpperCase(),
        state: (body.state || body.location || 'NIGERIA').toString().trim().toUpperCase(),
        status: 'active'
      };

      const { data, error } = await supabase
        .from("bases")
        .insert(payload)
        .select('*')
        .maybeSingle();

      console.log("DATABASE RESPONSE:", {
        data,
        error
      });

      if (error) {
        console.error('[SUPABASE BASE INSERT ERROR]', error);
        if (typeof alert !== 'undefined') alert(error.message);
        if (error.code === '23505' || error.message.includes('unique')) {
          return res.status(409).json({
            success: false,
            message: `Base Code ${baseCode} already exists.`,
            errors: { baseCode: `Base Code ${baseCode} already exists.` }
          });
        }
        return res.status(500).json({
          success: false,
          message: error.message || 'The base could not be saved to the database.',
          error: error.message
        });
      }

      const insertedBase = data || payload;

      // Audit Log with correct schema columns
      try {
        await supabase.from('audit_logs').insert({
          id: crypto.randomUUID(),
          actor_uid: null,
          actor_role: userRole,
          action: 'ADD_BASE',
          entity_type: 'BASE',
          entity_id: insertedBase.id,
          result: 'SUCCESS',
          created_at: new Date().toISOString()
        });
      } catch (aErr) {
        console.warn('[AUDIT LOG INSERT WARNING]', aErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Base created successfully.',
        data: insertedBase
      });
    } catch (err) {
      console.error('[POST /api/bases EXCEPTION]', err);
      return res.status(500).json({ success: false, message: 'The base could not be saved to the database.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
