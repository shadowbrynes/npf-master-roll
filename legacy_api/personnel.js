import { supabase } from './_supabase.js';
import crypto from 'crypto';

function normalizeCode(val) {
  return (val || '').toString().trim().replace(/\s+/g, ' ').toUpperCase();
}

function normalizeName(val) {
  return (val || '').toString().trim().replace(/\s+/g, ' ').toUpperCase();
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toString().trim());
}

function computeStatutoryRetirementDate(dobStr, enlistStr) {
  const dob = new Date(dobStr);
  const enlist = new Date(enlistStr);

  const retireByAge = new Date(dob);
  retireByAge.setFullYear(retireByAge.getFullYear() + 60);

  const retireByService = new Date(enlist);
  retireByService.setFullYear(retireByService.getFullYear() + 35);

  const earliest = retireByAge < retireByService ? retireByAge : retireByService;
  return earliest.toISOString().split('T')[0];
}

const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET /api/personnel
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('personnel')
        .select(`
          *,
          bases:base_id (id, base_code, base_name),
          units:unit_id (id, unit_code, unit_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SUPABASE GET PERSONNEL ERROR]', error);
        return res.status(500).json({
          success: false,
          message: 'Personnel records could not be retrieved from the database.',
          error: error.message
        });
      }

      const formatted = (data || []).map(p => {
        const apf = p.apf_no || p.ap_no || p.service_no || '';
        const nameVal = p.full_name || p.name || '';
        const edu = p.educational_qualification || p.edu_qual || '';
        const state = p.state_of_origin || '';
        const geo = p.geopolitical_zone || p.geo_pol_zone || '';
        const glVal = p.grade_level || p.gl || '';
        const baseIdVal = p.base_id || null;
        const unitIdVal = p.unit_id || null;

        return {
          id: p.id,
          personnelId: p.id,
          apNo: apf,
          apfNo: apf,
          apf_no: apf,
          serviceNo: apf,
          rank: p.rank,
          name: nameVal,
          fullName: nameVal,
          full_name: nameVal,
          eduQual: edu,
          educationalQualification: edu,
          educational_qualification: edu,
          stateOfOrigin: state,
          state_of_origin: state,
          lga: p.lga || '',
          tribe: p.tribe || '',
          geoPolZone: geo,
          geopoliticalZone: geo,
          geopolitical_zone: geo,
          dob: p.date_of_birth || p.dob || '',
          dateOfBirth: p.date_of_birth || p.dob || '',
          date_of_birth: p.date_of_birth || p.dob || '',
          enlistDate: p.date_of_enlistment || p.enlist_date || '',
          dateOfEnlistment: p.date_of_enlistment || p.enlist_date || '',
          date_of_enlistment: p.date_of_enlistment || p.enlist_date || '',
          lastPromDate: p.date_of_last_promotion || p.last_prom_date || '',
          dateOfLastPromotion: p.date_of_last_promotion || p.last_prom_date || '',
          date_of_last_promotion: p.date_of_last_promotion || p.last_prom_date || '',
          retireDate: p.retirement_date || p.retire_date || '',
          retirementDate: p.retirement_date || p.retire_date || '',
          retirement_date: p.retirement_date || p.retire_date || '',
          commandServedLast: p.command_served_last || '',
          command_served_last: p.command_served_last || '',
          transferredDate: p.date_transferred_to_command || p.transferred_date || '',
          dateTransferredToCommand: p.date_transferred_to_command || p.transferred_date || '',
          date_transferred_to_command: p.date_transferred_to_command || p.transferred_date || '',
          gdSp: p.gd_sp || '',
          gd_sp: p.gd_sp || '',
          gl: glVal,
          gradeLevel: glVal,
          grade_level: glVal,
          dutyPost: p.duty_post || '',
          duty_post: p.duty_post || '',
          employeeCode: p.employee_code || '',
          employee_code: p.employee_code || '',
          baseId: baseIdVal,
          base_id: baseIdVal,
          unitId: unitIdVal,
          unit_id: unitIdVal,
          status: p.status || 'active',
          registrationStatus: 'APPROVED',
          employmentStatus: p.status || 'active',
          baseName: p.bases ? p.bases.base_name : '',
          unitName: p.units ? p.units.unit_name : ''
        };
      });

      return res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted,
        source: "SUPABASE"
      });
    } catch (err) {
      console.error('[GET /api/personnel EXCEPTION]', err);
      return res.status(500).json({ success: false, message: 'Personnel records could not be retrieved from the database.' });
    }
  }

  // 2. POST /api/personnel
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
      const apfRaw = (body.apfNo || body.apNo || body.serviceNo || body.apf_no || '').toString().trim();
      const rankRaw = (body.rank || '').toString().trim().toUpperCase();
      const nameRaw = (body.fullName || body.name || body.full_name || '').toString().trim();
      const dobStr = body.dateOfBirth || body.dob || body.date_of_birth || '';
      const enlistStr = body.dateOfEnlistment || body.enlistDate || body.date_of_enlistment || '';
      const lastPromStr = body.dateOfLastPromotion || body.lastPromDate || body.date_of_last_promotion || '';
      const transStr = body.dateTransferredToCommand || body.transferredDate || body.date_transferred_to_command || '';
      const retireStr = body.retirementDate || body.retireDate || body.retirement_date || '';
      const emailStr = body.emailAddress || body.email || body.email_address || '';
      const phoneStr = body.phoneNumber || body.phone || body.phone_number || '';

      const baseIdRaw = body.baseId || body.currentBaseUnitId || body.base_id || null;
      const unitIdRaw = body.unitId || body.unit_id || null;

      const validatedBaseId = (baseIdRaw && isValidUUID(baseIdRaw)) ? baseIdRaw : null;
      const validatedUnitId = (unitIdRaw && isValidUUID(unitIdRaw)) ? unitIdRaw : null;

      if (baseIdRaw && !validatedBaseId) {
        return res.status(400).json({ success: false, message: 'Invalid Base ID format.', errors: { baseId: 'Base ID must be a valid UUID.' } });
      }
      if (unitIdRaw && !validatedUnitId) {
        return res.status(400).json({ success: false, message: 'Invalid Unit ID format.', errors: { unitId: 'Unit ID must be a valid UUID.' } });
      }

      const errors = {};
      if (!apfRaw) errors.apfNo = 'AP/F/NO is required.';
      if (!rankRaw) errors.rank = 'Rank is required.';
      if (!nameRaw) errors.fullName = 'Full Name is required.';
      if (!dobStr) errors.dob = 'Date of Birth is required.';
      if (!enlistStr) errors.enlistDate = 'Date of Enlistment is required.';

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, message: 'Required personnel fields missing.', errors });
      }

      const normApf = normalizeCode(apfRaw);
      const normName = normalizeName(nameRaw);
      const normEmpCode = normalizeCode(body.employeeCode || body.employee_code || ('PF' + Date.now().toString().slice(-6)));
      const normIppis = (body.ippisNumber || body.ippisNo || body.ippis_number || '').toString().trim();

      const todayStr = new Date().toISOString().split('T')[0];

      // Date Validations
      if (dobStr > todayStr) {
        errors.dob = 'Date of Birth cannot be in the future.';
      }
      if (enlistStr > todayStr) {
        errors.enlistDate = 'Date of Enlistment cannot be in the future.';
      }
      if (enlistStr < dobStr) {
        errors.enlistDate = 'Date of Enlistment cannot be earlier than Date of Birth.';
      }
      if (lastPromStr && lastPromStr < enlistStr) {
        errors.lastPromDate = 'Date of Last Promotion cannot be earlier than Date of Enlistment.';
      }
      if (transStr && transStr < enlistStr) {
        errors.transferredDate = 'Date Transferred to Command cannot be earlier than Date of Enlistment.';
      }
      if (emailStr && !isValidEmail(emailStr)) {
        errors.email = 'Please provide a valid email address.';
      }

      const calcRetireDate = computeStatutoryRetirementDate(dobStr, enlistStr);
      const finalRetireDate = retireStr || calcRetireDate;

      if (finalRetireDate < enlistStr) {
        errors.retireDate = 'Date of Retirement cannot be earlier than Date of Enlistment.';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, message: 'Personnel validation failed.', errors });
      }

      // Foreign Key Validation Checks
      if (validatedBaseId) {
        const { data: baseData, error: baseErr } = await supabase.from('bases').select('id').eq('id', validatedBaseId).maybeSingle();
        if (baseErr) {
          console.error('[SUPABASE BASE FK CHECK ERROR]', baseErr);
          return res.status(500).json({ success: false, message: 'Error verifying base existence.', error: baseErr.message });
        }
        if (!baseData) {
          return res.status(400).json({ success: false, message: 'Selected base does not exist.', errors: { baseId: 'Selected base ID is invalid.' } });
        }
      }

      if (validatedUnitId) {
        const { data: unitData, error: unitErr } = await supabase.from('units').select('id, base_id').eq('id', validatedUnitId).maybeSingle();
        if (unitErr) {
          console.error('[SUPABASE UNIT FK CHECK ERROR]', unitErr);
          return res.status(500).json({ success: false, message: 'Error verifying unit existence.', error: unitErr.message });
        }
        if (!unitData) {
          return res.status(400).json({ success: false, message: 'Selected unit does not exist.', errors: { unitId: 'Selected unit ID is invalid.' } });
        }
        if (validatedBaseId && unitData.base_id !== validatedBaseId) {
          return res.status(400).json({ success: false, message: 'Selected unit does not belong to the selected base.', errors: { unitId: 'Unit does not belong to selected base.' } });
        }
      }

      // Uniqueness Checks
      const { data: dupApf, error: dupApfErr } = await supabase.from('personnel').select('id').eq('apf_no', normApf).maybeSingle();
      if (dupApfErr) {
        console.error('[SUPABASE DUP APF CHECK ERROR]', dupApfErr);
        return res.status(500).json({ success: false, message: 'Error checking AP/F/NO uniqueness.', error: dupApfErr.message });
      }
      if (dupApf) {
        return res.status(409).json({ success: false, message: `AP/F/NO ${normApf} already exists.`, errors: { apfNo: `AP/F/NO ${normApf} is already registered.` } });
      }

      if (normEmpCode) {
        const { data: dupEmp } = await supabase.from('personnel').select('id').eq('employee_code', normEmpCode).maybeSingle();
        if (dupEmp) {
          return res.status(409).json({ success: false, message: `Employee Code ${normEmpCode} already exists.`, errors: { employeeCode: `Employee Code ${normEmpCode} is already registered.` } });
        }
      }

      const newPersonnelId = crypto.randomUUID();

      // Clean Supabase payload matching public.personnel schema
      const generalPayload = {
        id: newPersonnelId,
        apf_no: normApf,
        rank: rankRaw,
        full_name: normName,
        educational_qualification: (body.educationalQualification || body.eduQual || body.educational_qualification || 'BSC POLICE SCIENCE').toUpperCase(),
        state_of_origin: (body.stateOfOrigin || body.state_of_origin || 'EDO').toUpperCase(),
        lga: (body.lga || 'BENIN CITY').toUpperCase(),
        tribe: (body.tribe || 'ORAH').toUpperCase(),
        geopolitical_zone: (body.geopoliticalZone || body.geoPolZone || body.geopolitical_zone || 'SOUTH SOUTH').toUpperCase(),
        date_of_birth: dobStr,
        date_of_enlistment: enlistStr,
        date_of_last_promotion: lastPromStr || '2020-01-01',
        retirement_date: finalRetireDate,
        calculated_retirement_date: calcRetireDate,
        command_served_last: (body.commandServedLast || body.command_served_last || 'APAPA EOD BASE').toUpperCase(),
        date_transferred_to_command: transStr || '2023-01-01',
        gd_sp: (body.gdSp || body.gd_sp || 'EOD TECH').toUpperCase(),
        grade_level: (body.gradeLevel || body.gl || body.grade_level || '10').toString(),
        duty_post: (body.dutyPost || body.duty_post || 'EOD OPERATIVE').toUpperCase(),
        employee_code: normEmpCode,
        base_id: validatedBaseId,
        unit_id: validatedUnitId,
        status: 'active'
      };

      const { data: insertedPersonnel, error: pErr } = await supabase.from('personnel').insert(generalPayload).select().single();
      if (pErr) {
        console.error('[SUPABASE INSERT PERSONNEL ERROR]', pErr);
        if (pErr.code === '23503') {
          return res.status(400).json({ success: false, message: 'Foreign key constraint violated: Selected Base or Unit ID does not exist in database.', error: pErr.message });
        }
        return res.status(500).json({ success: false, message: 'Personnel record could not be saved to the database.', error: pErr.message });
      }

      // Clean Supabase payload matching public.personnel_private schema
      const privatePayload = {
        personnel_id: newPersonnelId,
        account_number: body.accountNumber || body.accountNo || body.account_number || '',
        bank_name: (body.bankName || body.bank_name || 'POLICE MORTGAGE BANK').toUpperCase(),
        ippis_number: normIppis || ('1000' + Date.now().toString().slice(-6)),
        pfa: (body.pfa || 'NPF PENSION').toUpperCase(),
        pen_pin: body.penPin || body.pen_pin || ('PEN-' + normApf),
        nhf_number: body.nhfNumber || body.nhfNo || body.nhf_number || ('NHF-' + normApf),
        mss: (body.mss || 'APAPA BASE LAGOS').toUpperCase(),
        email_address: emailStr ? emailStr.toLowerCase() : 'officer@npf.gov.ng',
        phone_number: phoneStr || '08034268620'
      };

      const { error: privErr } = await supabase.from('personnel_private').insert(privatePayload);
      if (privErr) {
        console.error('[SUPABASE INSERT PERSONNEL PRIVATE ERROR]', privErr);
        // Rollback personnel row
        await supabase.from('personnel').delete().eq('id', newPersonnelId);
        return res.status(500).json({ success: false, message: 'Sensitive personnel details could not be saved. Operation rolled back.', error: privErr.message });
      }

      // Audit Log
      try {
        await supabase.from('audit_logs').insert({
          id: crypto.randomUUID(),
          actor_uid: null,
          actor_role: userRole,
          action: 'ADD_PERSONNEL',
          entity_type: 'PERSONNEL',
          entity_id: newPersonnelId,
          result: 'SUCCESS',
          created_at: new Date().toISOString()
        });
      } catch (aErr) {
        console.warn('[AUDIT LOG INSERT WARNING]', aErr.message);
      }

      const responseOfficer = {
        id: insertedPersonnel.id,
        personnelId: insertedPersonnel.id,
        apNo: insertedPersonnel.apf_no,
        apfNo: insertedPersonnel.apf_no,
        apf_no: insertedPersonnel.apf_no,
        serviceNo: insertedPersonnel.apf_no,
        rank: insertedPersonnel.rank,
        name: insertedPersonnel.full_name,
        fullName: insertedPersonnel.full_name,
        full_name: insertedPersonnel.full_name,
        eduQual: insertedPersonnel.educational_qualification,
        educationalQualification: insertedPersonnel.educational_qualification,
        stateOfOrigin: insertedPersonnel.state_of_origin,
        lga: insertedPersonnel.lga,
        tribe: insertedPersonnel.tribe,
        geoPolZone: insertedPersonnel.geopolitical_zone,
        dob: insertedPersonnel.date_of_birth,
        dateOfBirth: insertedPersonnel.date_of_birth,
        enlistDate: insertedPersonnel.date_of_enlistment,
        dateOfEnlistment: insertedPersonnel.date_of_enlistment,
        lastPromDate: insertedPersonnel.date_of_last_promotion,
        dateOfLastPromotion: insertedPersonnel.date_of_last_promotion,
        retireDate: insertedPersonnel.retirement_date,
        retirementDate: insertedPersonnel.retirement_date,
        commandServedLast: insertedPersonnel.command_served_last,
        transferredDate: insertedPersonnel.date_transferred_to_command,
        dateTransferredToCommand: insertedPersonnel.date_transferred_to_command,
        gdSp: insertedPersonnel.gd_sp,
        gl: insertedPersonnel.grade_level,
        gradeLevel: insertedPersonnel.grade_level,
        dutyPost: insertedPersonnel.duty_post,
        employeeCode: insertedPersonnel.employee_code,
        currentBaseUnitId: insertedPersonnel.base_id,
        baseId: insertedPersonnel.base_id,
        base_id: insertedPersonnel.base_id,
        unitId: insertedPersonnel.unit_id,
        unit_id: insertedPersonnel.unit_id,
        status: insertedPersonnel.status,
        registrationStatus: 'APPROVED',
        employmentStatus: insertedPersonnel.status,
        createdAt: insertedPersonnel.created_at
      };

      return res.status(201).json({
        success: true,
        message: 'Personnel added successfully.',
        data: responseOfficer
      });

    } catch (err) {
      console.error('[POST /api/personnel EXCEPTION]', err);
      return res.status(500).json({ success: false, message: 'Personnel could not be saved to the database.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
