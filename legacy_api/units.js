import { supabase } from './_supabase.js';
import crypto from 'crypto';

function normalizeCode(str) {
  return (str || '').toString().trim().replace(/\s+/g, ' ').toUpperCase();
}

function normalizeName(str) {
  return (str || '').toString().trim().replace(/\s+/g, ' ').toUpperCase();
}

const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET /api/units
  if (req.method === 'GET') {
    try {
      let query = supabase
        .from('units')
        .select('*, bases:base_id (id, base_code, base_name)')
        .order('created_at', { ascending: false });

      const baseIdFilter = req.query ? (req.query.baseId || req.query.base_id) : null;
      if (baseIdFilter && isValidUUID(baseIdFilter)) {
        query = query.eq('base_id', baseIdFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SUPABASE GET UNITS ERROR]', error);
        return res.status(500).json({ success: false, message: 'Units could not be retrieved from the database.', error: error.message });
      }

      const formatted = (data || []).map(u => ({
        id: u.id,
        unitCode: u.unit_code || u.unitCode || '',
        unit_code: u.unit_code || u.unitCode || '',
        unitName: u.unit_name || u.unitName || '',
        unit_name: u.unit_name || u.unitName || '',
        baseId: u.base_id || u.baseId || '',
        base_id: u.base_id || u.baseId || '',
        commandName: u.command_name || 'NATIONAL COMMAND',
        command_name: u.command_name || 'NATIONAL COMMAND',
        location: u.location || 'NIGERIA',
        description: u.description || '',
        status: u.status || 'active',
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        baseName: u.bases ? u.bases.base_name : ''
      }));

      return res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted,
        source: "SUPABASE"
      });
    } catch (err) {
      console.error('[GET /api/units EXCEPTION]', err);
      return res.status(500).json({ success: false, message: 'Units could not be retrieved from the database.' });
    }
  }

  // 2. POST /api/units
  if (req.method === 'POST') {
    try {
      const userRole = req.headers['x-user-role'] || (req.body && req.body.userRole) || 'GLOBAL_ADMIN';
      const authorizedRoles = ['GLOBAL_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'RECORDS_ADMIN', 'SYSTEM_ADMINISTRATOR', 'PERSONNEL_ADMINISTRATOR', 'super_admin', 'system_admin', 'personnel_admin'];

      if (!authorizedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action.'
        });
      }

      const body = req.body || {};
      const unitCodeRaw = body.unitCode || body.unit_code || '';
      const unitNameRaw = body.unitName || body.unit_name || '';
      const baseIdRaw = body.baseId || body.base_id || '';
      const commandName = (body.commandName || body.command || 'NATIONAL COMMAND').toString().trim().toUpperCase();
      const location = (body.location || 'NIGERIA').toString().trim().toUpperCase();
      const description = (body.description || '').toString().trim();

      const normCode = normalizeCode(unitCodeRaw);
      const normName = normalizeName(unitNameRaw);
      const validatedBaseId = (baseIdRaw && isValidUUID(baseIdRaw)) ? baseIdRaw : null;

      const errors = {};
      if (!normCode) errors.unitCode = 'Unit Code is required.';
      if (!normName) errors.unitName = 'Unit Name is required.';
      if (!validatedBaseId) errors.baseId = 'Parent Base ID is required and must be a valid UUID.';

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, message: 'Required unit fields missing.', errors });
      }

      // Check if selected base exists in Supabase
      const { data: baseData, error: baseErr } = await supabase.from('bases').select('id').eq('id', validatedBaseId).maybeSingle();
      if (baseErr) {
        console.error('[SUPABASE UNIT BASE CHECK ERROR]', baseErr);
        return res.status(500).json({ success: false, message: 'Error checking base existence in database.', error: baseErr.message });
      }
      if (!baseData) {
        return res.status(400).json({ success: false, message: 'Selected Base does not exist in database.', errors: { baseId: 'Selected Base ID is invalid.' } });
      }

      // Check duplicate Unit Code
      const { data: dupUnit, error: dupErr } = await supabase.from('units').select('id').eq('unit_code', normCode).maybeSingle();
      if (dupErr) {
        console.error('[SUPABASE UNIT DUP CHECK ERROR]', dupErr);
        return res.status(500).json({ success: false, message: 'Error checking unit uniqueness in database.', error: dupErr.message });
      }
      if (dupUnit) {
        return res.status(409).json({ success: false, message: `Unit Code ${normCode} already exists.`, errors: { unitCode: `Unit Code ${normCode} is already registered.` } });
      }

      const newUnitId = crypto.randomUUID();
      const payload = {
        id: newUnitId,
        unit_code: normCode,
        unit_name: normName,
        base_id: validatedBaseId,
        command_name: commandName,
        location: location,
        description: description,
        status: 'active'
      };

      const { data: insertedUnit, error: unitErr } = await supabase
        .from('units')
        .insert(payload)
        .select()
        .single();

      if (unitErr) {
        console.error('[SUPABASE INSERT UNIT ERROR]', unitErr);
        if (unitErr.code === '23505' || unitErr.message.includes('unique')) {
          return res.status(409).json({ success: false, message: `Unit Code ${normCode} already exists.`, errors: { unitCode: `Unit Code ${normCode} already exists.` } });
        }
        return res.status(500).json({ success: false, message: 'The unit could not be saved to the database.', error: unitErr.message });
      }

      // Audit Log with correct schema columns
      try {
        const { error: aErr } = await supabase.from('audit_logs').insert({
          id: crypto.randomUUID(),
          actor_uid: null,
          actor_role: userRole,
          action: 'ADD_UNIT',
          entity_type: 'UNIT',
          entity_id: insertedUnit.id,
          result: 'SUCCESS',
          created_at: new Date().toISOString()
        });
        if (aErr) console.warn('[AUDIT LOG INSERT WARNING]', aErr.message);
      } catch (aErr) {
        console.warn('[AUDIT LOG EXCEPTION]', aErr.message);
      }

      const responseUnit = {
        id: insertedUnit.id,
        unitCode: insertedUnit.unit_code,
        unit_code: insertedUnit.unit_code,
        unitName: insertedUnit.unit_name,
        unit_name: insertedUnit.unit_name,
        baseId: insertedUnit.base_id,
        base_id: insertedUnit.base_id,
        commandName: insertedUnit.command_name,
        location: insertedUnit.location,
        description: insertedUnit.description,
        status: insertedUnit.status,
        createdAt: insertedUnit.created_at
      };

      return res.status(201).json({
        success: true,
        message: 'Unit added successfully.',
        data: responseUnit
      });

    } catch (err) {
      console.error('[POST /api/units EXCEPTION]', err);
      return res.status(500).json({ success: false, message: 'The unit could not be saved. Please contact the system administrator.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
