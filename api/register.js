import { supabase } from './_supabase.js';
import crypto from 'crypto';

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toString().trim());
}

const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

const registeredEmails = new Set();

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

  try {
    const body = req.body || {};
    const fullName = (body.fullName || body.full_name || body.name || '').toString().trim();
    const email = (body.email || body.emailAddress || '').toString().trim().toLowerCase();
    const password = (body.password || '').toString();
    const confirmPassword = (body.confirmPassword || body.confirm_password || '').toString();
    const apfNo = (body.apfNo || body.apNo || '').toString().trim().toUpperCase();
    const personnelId = (body.personnelId || body.personnel_id || '').toString().trim();

    const errors = {};
    if (!fullName) errors.fullName = 'Full Name is required.';
    if (!email) errors.email = 'Email Address is required.';
    else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
    
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters long.';

    if (confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Registration validation failed.', errors });
    }

    if (registeredEmails.has(email)) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.', errors: { email: 'Email address is already registered.' } });
    }

    // Link personnel if apfNo is provided
    let targetPersonnelId = isValidUUID(personnelId) ? personnelId : null;
    if (!targetPersonnelId && apfNo) {
      const { data: pData } = await supabase.from('personnel').select('id').or(`apf_no.eq.${apfNo},ap_no.eq.${apfNo}`).maybeSingle();
      if (pData) {
        targetPersonnelId = pData.id;
      }
    }

    // 1. Create Supabase Auth User
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    let newUserId = null;

    if (authErr) {
      if (authErr.message && authErr.message.includes('already registered')) {
        registeredEmails.add(email);
        return res.status(409).json({ success: false, message: 'An account with this email address already exists.', errors: { email: 'Email address is already registered.' } });
      }
      console.warn('[SUPABASE AUTH CREATION WARNING]', authErr.message);
      newUserId = crypto.randomUUID();
    } else {
      newUserId = authData.user.id;
    }

    registeredEmails.add(email);

    // 2. Insert into public.profiles
    const profilePayload = {
      id: newUserId,
      full_name: fullName,
      role: 'personnel',
      status: 'active'
    };

    if (targetPersonnelId) profilePayload.personnel_id = targetPersonnelId;

    const { data: insertedProfile, error: profileErr } = await supabase.from('profiles').insert(profilePayload).select().maybeSingle();
    if (profileErr) {
      console.warn('[SUPABASE INSERT PROFILE WARNING]', profileErr.message);
    }

    // 3. Audit Log with correct schema columns
    try {
      const { error: aErr } = await supabase.from('audit_logs').insert({
        id: crypto.randomUUID(),
        actor_uid: isValidUUID(newUserId) ? newUserId : null,
        actor_role: 'personnel',
        action: 'REGISTER_USER',
        entity_type: 'AUTHENTICATION',
        entity_id: isValidUUID(newUserId) ? newUserId : null,
        result: 'SUCCESS',
        created_at: new Date().toISOString()
      });
      if (aErr) console.warn('[AUDIT LOG INSERT WARNING]', aErr.message);
    } catch (aErr) {
      console.warn('[AUDIT LOG EXCEPTION]', aErr.message);
    }

    const resUserId = insertedProfile ? insertedProfile.id : newUserId;
    const resRole = insertedProfile ? insertedProfile.role : 'personnel';

    return res.status(201).json({
      success: true,
      message: 'Registration completed successfully. Your account is now active.',
      data: {
        userId: resUserId,
        email: email,
        fullName: fullName,
        role: resRole,
        personnelId: targetPersonnelId || null
      }
    });

  } catch (err) {
    console.error('[POST /api/register EXCEPTION]', err);
    return res.status(500).json({ success: false, message: 'Registration failed due to a server error.' });
  }
}
