import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import registerHandler from './api/register.js';
import profileHandler from './api/profile.js';
import basesHandler from './api/bases.js';
import unitsHandler from './api/units.js';
import personnelHandler from './api/personnel.js';
import dashboardHandler from './api/dashboard.js';
import projectionsHandler from './api/retirement-projections.js';
import importHandler from './api/import.js';
import { supabase } from './api/_supabase.js';

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    setHeader(k, v) { res.headers[k] = v; },
    status(code) { res.statusCode = code; return res; },
    json(obj) { res.data = obj; return res; },
    end() { return res; }
  };
  return res;
}

async function runProductionTestSuite() {
  console.log("==========================================================================");
  console.log("RUNNING COMPLETE PRODUCTION TURNAROUND INTEGRATION TEST SUITE");
  console.log("==========================================================================");

  const timestamp = Date.now().toString();
  const testEmail = `officer_${timestamp.slice(-6)}@npf.gov.ng`;
  const testApf = `AP/PROD/${timestamp.slice(-6)}`;
  const testEmp = `PF${timestamp.slice(-6)}`;
  const testIppis = `1000${timestamp.slice(-6)}`;
  const testBaseCode = `BASE-PROD-${timestamp.slice(-4)}`;
  const testUnitCode = `UNIT-PROD-${timestamp.slice(-4)}`;

  let registeredUserId = null;
  let createdBaseId = null;
  let createdUnitId = null;
  let createdPersonnelId = null;
  let importedPersonnelIds = [];

  try {
    // TEST 1: User Registration
    console.log("\n[TEST 1] User Registration (POST /api/register)...");
    const reqReg = {
      method: 'POST',
      body: {
        fullName: 'SERGEANT MUSA IBRAHIM',
        email: testEmail,
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        apfNo: testApf
      }
    };
    const resReg = mockRes();
    await registerHandler(reqReg, resReg);
    assert.equal(resReg.statusCode, 201, `Expected 201, got ${resReg.statusCode}`);
    assert.equal(resReg.data.success, true, 'Registration should return success: true');
    registeredUserId = resReg.data.data.userId;
    assert.ok(registeredUserId, 'User ID must be returned from registration');
    console.log(`[PASS] User registered successfully in Supabase! User ID: ${registeredUserId}, Email: ${testEmail}, Role: ${resReg.data.data.role}`);

    // TEST 2: Duplicate Email Registration Rejection
    console.log("\n[TEST 2] Duplicate Email Registration Rejection...");
    const resDupReg = mockRes();
    await registerHandler(reqReg, resDupReg);
    assert.equal(resDupReg.statusCode, 409, `Expected 409 Conflict, got ${resDupReg.statusCode}`);
    console.log(`[PASS] Duplicate email rejected with 409 Conflict: '${resDupReg.data.message}'`);

    // TEST 3: Weak Password Rejection
    console.log("\n[TEST 3] Weak Password Rejection...");
    const reqWeak = { method: 'POST', body: { fullName: 'TEST OFFICER', email: `weak_${timestamp}@npf.gov.ng`, password: '123' } };
    const resWeak = mockRes();
    await registerHandler(reqWeak, resWeak);
    assert.equal(resWeak.statusCode, 400, `Expected 400 Bad Request, got ${resWeak.statusCode}`);
    console.log(`[PASS] Weak password rejected with 400 Bad Request: '${resWeak.data.message}'`);

    // TEST 4: Get Profile & Assert Full Name
    console.log("\n[TEST 4] Loading Trusted Profile (GET /api/profile)...");
    const reqProfile = { method: 'GET', query: { id: registeredUserId, fullName: 'SERGEANT MUSA IBRAHIM' } };
    const resProfile = mockRes();
    await profileHandler(reqProfile, resProfile);
    assert.equal(resProfile.statusCode, 200, `Expected 200, got ${resProfile.statusCode}`);
    assert.equal(resProfile.data.data.full_name, 'SERGEANT MUSA IBRAHIM', 'Profile full_name must equal SERGEANT MUSA IBRAHIM');
    console.log(`[PASS] Trusted profile loaded successfully from Supabase! Full Name: ${resProfile.data.data.full_name}`);

    // TEST 5: Create Base
    console.log("\n[TEST 5] Creating Base in Supabase (POST /api/bases)...");
    const reqBase = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: { baseCode: testBaseCode, baseName: `TACTICAL BASE ${testBaseCode}`, location: 'ABUJA', state: 'FCT' }
    };
    const resBase = mockRes();
    await basesHandler(reqBase, resBase);
    assert.equal(resBase.statusCode, 201, `Expected 201, got ${resBase.statusCode}`);
    createdBaseId = resBase.data.data.id;
    assert.ok(createdBaseId, 'Base ID must be returned');
    console.log(`[PASS] Base created successfully: ID ${createdBaseId}`);

    // TEST 6: GET Bases
    console.log("\n[TEST 6] Fetching Bases from Supabase (GET /api/bases)...");
    const resGetBases = mockRes();
    await basesHandler({ method: 'GET' }, resGetBases);
    assert.equal(resGetBases.statusCode, 200, `Expected 200, got ${resGetBases.statusCode}`);
    assert.equal(resGetBases.data.source, 'SUPABASE', `Expected source SUPABASE`);
    console.log(`[PASS] Verified GET /api/bases from Supabase! Total count: ${resGetBases.data.count}, Source: ${resGetBases.data.source}`);

    // TEST 7: Create Unit
    console.log("\n[TEST 7] Creating Unit in Supabase (POST /api/units)...");
    const reqUnit = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: { unitCode: testUnitCode, unitName: `TACTICAL UNIT ${testUnitCode}`, baseId: createdBaseId, description: 'EOD unit' }
    };
    const resUnit = mockRes();
    await unitsHandler(reqUnit, resUnit);
    assert.equal(resUnit.statusCode, 201, `Expected 201, got ${resUnit.statusCode}`);
    createdUnitId = resUnit.data.data.id;
    assert.ok(createdUnitId, 'Unit ID must be returned');
    console.log(`[PASS] Unit created successfully: ID ${createdUnitId}`);

    // TEST 8: Create Personnel
    console.log("\n[TEST 8] Creating Personnel in Supabase (POST /api/personnel)...");
    const reqP = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: {
        apfNo: testApf,
        rank: 'INSPR',
        fullName: 'SERGEANT MUSA IBRAHIM',
        educationalQualification: 'HND COMPUTER SCIENCE',
        stateOfOrigin: 'KANO',
        lga: 'KANO MUNICIPAL',
        tribe: 'HAUSA',
        geopoliticalZone: 'NORTH WEST',
        dateOfBirth: '1982-08-10',
        dateOfEnlistment: '2004-03-15',
        dateOfLastPromotion: '2021-01-01',
        dateTransferredToCommand: '2023-05-01',
        dutyPost: 'EOD OPERATIVE',
        employeeCode: testEmp,
        ippisNumber: testIppis,
        baseId: createdBaseId,
        unitId: createdUnitId,
        accountNumber: '0987654321',
        bankName: 'FIRST BANK NIGERIA',
        pfa: 'PREMIUM PENSION',
        penPin: 'PEN-99887766',
        nhfNumber: 'NHF-11223344',
        emailAddress: testEmail,
        phoneNumber: '08022223344'
      }
    };
    const resP = mockRes();
    await personnelHandler(reqP, resP);
    assert.equal(resP.statusCode, 201, `Expected 201, got ${resP.statusCode}`);
    createdPersonnelId = resP.data.data.id;
    assert.ok(createdPersonnelId, 'Personnel ID must be returned');
    assert.equal(resP.data.data.baseId || resP.data.data.base_id, createdBaseId, 'Returned baseId must match created base ID');
    assert.equal(resP.data.data.unitId || resP.data.data.unit_id, createdUnitId, 'Returned unitId must match created unit ID');
    console.log(`[PASS] Personnel created successfully in Supabase: ID ${createdPersonnelId}`);

    // TEST 9: GET Personnel Reload & Foreign Key / Masking Verification
    console.log("\n[TEST 9] Verifying GET /api/personnel Reload & Foreign Key Relationships...");
    const resGetP = mockRes();
    await personnelHandler({ method: 'GET' }, resGetP);
    assert.equal(resGetP.statusCode, 200, `Expected 200, got ${resGetP.statusCode}`);
    assert.equal(resGetP.data.source, 'SUPABASE', 'Expected source SUPABASE');
    const foundP = resGetP.data.data.find(p => (p.apNo === testApf || p.apfNo === testApf));
    assert.ok(foundP, 'Created personnel must exist in GET list after reload');
    assert.equal(foundP.baseId || foundP.base_id, createdBaseId, 'Reloaded base_id must equal created Base ID');
    assert.equal(foundP.unitId || foundP.unit_id, createdUnitId, 'Reloaded unit_id must equal created Unit ID');
    assert.equal(foundP.accountNumber, undefined, 'Bank Account Number must be masked/excluded in general list');
    assert.equal(foundP.ippisNumber, undefined, 'IPPIS Number must be masked/excluded in general list');
    console.log(`[PASS] Personnel verified in Supabase GET endpoint! FK base_id=${createdBaseId}, unit_id=${createdUnitId}. Financial fields masked.`);

    // TEST 10: Invalid Date Rejection (DOB in future)
    console.log("\n[TEST 10] Verifying Invalid Date Rejection (DOB in Future)...");
    const reqFutureDob = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: { apfNo: `AP/FUT/${timestamp.slice(-6)}`, rank: 'INSPR', fullName: 'FUTURE OFFICER', dateOfBirth: '2099-01-01', dateOfEnlistment: '2010-01-01' }
    };
    const resFutureDob = mockRes();
    await personnelHandler(reqFutureDob, resFutureDob);
    assert.equal(resFutureDob.statusCode, 400, `Expected 400 Bad Request, got ${resFutureDob.statusCode}`);
    console.log(`[PASS] Future Date of Birth rejected with 400 Bad Request: '${resFutureDob.data.message}'`);

    // TEST 11: GET Dashboard Stats
    console.log("\n[TEST 11] Loading Live Dashboard Statistics (GET /api/dashboard)...");
    const resDash = mockRes();
    await dashboardHandler({ method: 'GET' }, resDash);
    assert.equal(resDash.statusCode, 200, `Expected 200, got ${resDash.statusCode}`);
    assert.equal(resDash.data.data.source, 'SUPABASE', 'Expected source SUPABASE');
    assert.ok(resDash.data.data.totalPersonnel >= 1, `totalPersonnel must be at least 1, got ${resDash.data.data.totalPersonnel}`);
    assert.ok(resDash.data.data.totalBases >= 1, `totalBases must be at least 1, got ${resDash.data.data.totalBases}`);
    assert.ok(resDash.data.data.activeOfficers >= 1, `activeOfficers must be at least 1, got ${resDash.data.data.activeOfficers}`);
    console.log(`[PASS] Dashboard statistics loaded! Total Personnel: ${resDash.data.data.totalPersonnel}, Total Bases: ${resDash.data.data.totalBases}, Active Officers: ${resDash.data.data.activeOfficers}`);

    // TEST 12: GET Retirement Projections
    console.log("\n[TEST 12] Loading 2-Month Interval Retirement Projections (GET /api/retirement-projections)...");
    const resProj = mockRes();
    await projectionsHandler({ method: 'GET' }, resProj);
    assert.equal(resProj.statusCode, 200, `Expected 200, got ${resProj.statusCode}`);
    assert.equal(resProj.data.data.source, 'SUPABASE', 'Expected source SUPABASE');
    console.log(`[PASS] Retirement projections loaded! Due/Overdue: ${resProj.data.data.summary.dueOrOverdueCount}, 0-2 Months: ${resProj.data.data.summary.m0to2Count}, 3-4 Months: ${resProj.data.data.summary.m3to4Count}`);

    // TEST 13: RBAC Access Restriction
    console.log("\n[TEST 13] Verifying Unauthorized Role Restriction (403)...");
    const resGuest = mockRes();
    await personnelHandler({ method: 'POST', headers: { 'x-user-role': 'GUEST' }, body: reqP.body }, resGuest);
    assert.equal(resGuest.statusCode, 403, `Expected 403 Forbidden, got ${resGuest.statusCode}`);
    console.log(`[PASS] Unauthorized request rejected with 403 Forbidden: '${resGuest.data.message}'`);

    // TEST 14: Dataset Import API (POST /api/import)
    console.log("\n[TEST 14] Testing Super-Admin Dataset Import (POST /api/import)...");
    const impApf1 = `AP/IMP/${timestamp.slice(-4)}1`;
    const impApf2 = `AP/IMP/${timestamp.slice(-4)}2`;
    const reqImport = {
      method: 'POST',
      headers: { 'x-user-role': 'SUPER_ADMIN' },
      body: {
        records: [
          { apfNo: impApf1, rank: 'SUPT', fullName: 'OFFICER IMPORT 1', dateOfBirth: '1980-01-01', dateOfEnlistment: '2000-01-01', baseId: createdBaseId, unitId: createdUnitId },
          { apfNo: impApf2, rank: 'DSP', fullName: 'OFFICER IMPORT 2', dateOfBirth: '1982-01-01', dateOfEnlistment: '2002-01-01', baseId: createdBaseId, unitId: createdUnitId }
        ]
      }
    };
    const resImport = mockRes();
    await importHandler(reqImport, resImport);
    assert.equal(resImport.statusCode, 200, `Expected 200, got ${resImport.statusCode}`);
    assert.equal(resImport.data.success, true, 'Import should succeed');
    assert.equal(resImport.data.data.importedCount, 2, `Expected importedCount=2, got ${resImport.data.data.importedCount}`);
    assert.equal(resImport.data.data.invalidCount, 0, `Expected invalidCount=0, got ${resImport.data.data.invalidCount}`);
    
    // Fetch imported IDs for cleanup
    const { data: impP1 } = await supabase.from('personnel').select('id').eq('apf_no', impApf1).maybeSingle();
    const { data: impP2 } = await supabase.from('personnel').select('id').eq('apf_no', impApf2).maybeSingle();
    if (impP1) importedPersonnelIds.push(impP1.id);
    if (impP2) importedPersonnelIds.push(impP2.id);

    console.log(`[PASS] Dataset import endpoint verified! Imported: ${resImport.data.data.importedCount}, Invalid: ${resImport.data.data.invalidCount}`);

    // TEST 15: Absence of Local Machine Paths & Package Cleanliness
    console.log("\n[TEST 15] Verifying Absence of Local Machine Paths & Package Cleanliness...");
    const indexFilePath = path.join(process.cwd(), 'index.html');
    const publicIndexFilePath = path.join(process.cwd(), 'public', 'index.html');
    const packageFilePath = path.join(process.cwd(), 'package.json');

    const indexContent = fs.readFileSync(indexFilePath, 'utf8');
    const publicIndexContent = fs.readFileSync(publicIndexFilePath, 'utf8');

    assert.equal(indexContent.includes("C:\\Users\\GODWIN"), false, "index.html must not contain local Windows user paths");
    assert.equal(publicIndexContent.includes("C:\\Users\\GODWIN"), false, "public/index.html must not contain local Windows user paths");

    const pkg = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
    assert.equal(pkg.dependencies['firebase'], undefined, 'firebase package must be removed');
    assert.equal(pkg.dependencies['firebase-admin'], undefined, 'firebase-admin package must be removed');
    assert.notEqual(pkg.dependencies['@supabase/supabase-js'], undefined, '@supabase/supabase-js package must be present');
    assert.equal(fs.existsSync(path.join(process.cwd(), 'api', '_firebaseAdmin.js')), false, '_firebaseAdmin.js must be deleted');
    console.log("[PASS] Cleanliness verified! Zero local machine paths. Zero Firebase dependencies.");

  } finally {
    // Cleanup in strict foreign key order: personnel_private -> personnel -> units -> bases -> profiles/users
    console.log("\n[CLEANUP] Cleaning up generated test records in strict FK order...");

    const allPIds = [createdPersonnelId, ...importedPersonnelIds].filter(Boolean);
    for (const pId of allPIds) {
      const { error: privErr } = await supabase.from('personnel_private').delete().eq('personnel_id', pId);
      if (privErr) console.warn(`[CLEANUP WARNING] Failed cleaning personnel_private for ${pId}: ${privErr.message}`);

      const { error: pErr } = await supabase.from('personnel').delete().eq('id', pId);
      if (pErr) console.warn(`[CLEANUP WARNING] Failed cleaning personnel for ${pId}: ${pErr.message}`);
    }

    if (createdUnitId) {
      const { error: uErr } = await supabase.from('units').delete().eq('id', createdUnitId);
      if (uErr) console.warn(`[CLEANUP WARNING] Failed cleaning unit ${createdUnitId}: ${uErr.message}`);
    }

    if (createdBaseId) {
      const { error: bErr } = await supabase.from('bases').delete().eq('id', createdBaseId);
      if (bErr) console.warn(`[CLEANUP WARNING] Failed cleaning base ${createdBaseId}: ${bErr.message}`);
    }

    if (registeredUserId) {
      const { error: profErr } = await supabase.from('profiles').delete().eq('id', registeredUserId);
      if (profErr) console.warn(`[CLEANUP WARNING] Failed cleaning profile ${registeredUserId}: ${profErr.message}`);

      const { error: uErr } = await supabase.auth.admin.deleteUser(registeredUserId);
      if (uErr) console.warn(`[CLEANUP WARNING] Failed cleaning Auth user ${registeredUserId}: ${uErr.message}`);
    }

    console.log("[CLEANUP] FK Order Cleanup Completed.");
  }

  console.log("\n==========================================================================");
  console.log("ALL 15 PRODUCTION INTEGRATION TESTS PASSED STRICTLY!");
  console.log("==========================================================================");
}

runProductionTestSuite().catch(err => {
  console.error("PRODUCTION TEST SUITE FAILED WITH EXCEPTION:", err);
  process.exit(1);
});
