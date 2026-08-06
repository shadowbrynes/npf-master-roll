import assert from 'node:assert/strict';
import basesHandler from './api/bases.js';
import unitsHandler from './api/units.js';
import personnelHandler from './api/personnel.js';
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

async function runAllTests() {
  console.log("==========================================================================");
  console.log("RUNNING NODE.JS SUPABASE PRODUCTION INTEGRATION TEST SUITE");
  console.log("==========================================================================");

  const timestamp = Date.now().toString();
  const testApf = `AP/SUPA/${timestamp.slice(-6)}`;
  const testEmp = `PF${timestamp.slice(-6)}`;
  const testIppis = `1000${timestamp.slice(-6)}`;
  const testBaseCode = `BASE-SUPA-${timestamp.slice(-4)}`;
  const testUnitCode = `UNIT-SUPA-${timestamp.slice(-4)}`;

  let createdBaseId = null;
  let createdUnitId = null;
  let createdPersonnelId = null;

  try {
    // 1. Create Base
    console.log("\n[TEST 1] Creating Base in Supabase (POST /api/bases)...");
    const reqBase = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: {
        baseCode: testBaseCode,
        baseName: `APAPA TACTICAL BASE ${testBaseCode}`,
        location: 'LAGOS',
        state: 'LAGOS'
      }
    };
    const resBase = mockRes();
    await basesHandler(reqBase, resBase);
    assert.equal(resBase.statusCode, 201, `Expected 201, got ${resBase.statusCode}`);
    assert.equal(resBase.data.success, true, 'Expected success: true');
    createdBaseId = resBase.data.data.id;
    assert.ok(createdBaseId, 'Base ID must be returned');
    console.log(`[PASS] Base created successfully in Supabase: ID ${createdBaseId}`);

    // 2. GET Bases
    console.log("\n[TEST 2] Fetching Bases from Supabase (GET /api/bases)...");
    const reqGetBases = { method: 'GET', headers: {} };
    const resGetBases = mockRes();
    await basesHandler(reqGetBases, resGetBases);
    assert.equal(resGetBases.statusCode, 200, `Expected 200, got ${resGetBases.statusCode}`);
    assert.equal(resGetBases.data.source, 'SUPABASE', `Expected source SUPABASE, got ${resGetBases.data.source}`);
    console.log(`[PASS] Verified GET /api/bases from Supabase! Total count: ${resGetBases.data.count}, Source: ${resGetBases.data.source}`);

    // 3. Create Unit
    console.log("\n[TEST 3] Creating Unit in Supabase (POST /api/units)...");
    const reqUnit = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: {
        unitCode: testUnitCode,
        unitName: `OPERATIONS UNIT ${testUnitCode}`,
        baseId: createdBaseId,
        description: 'Tactical EOD CBRN unit'
      }
    };
    const resUnit = mockRes();
    await unitsHandler(reqUnit, resUnit);
    assert.equal(resUnit.statusCode, 201, `Expected 201, got ${resUnit.statusCode}`);
    createdUnitId = resUnit.data.data.id;
    assert.ok(createdUnitId, 'Unit ID must be returned');
    console.log(`[PASS] Unit created successfully in Supabase: ID ${createdUnitId}`);

    // 4. GET Units
    console.log("\n[TEST 4] Fetching Units from Supabase (GET /api/units)...");
    const reqGetUnits = { method: 'GET', headers: {}, query: { baseId: createdBaseId } };
    const resGetUnits = mockRes();
    await unitsHandler(reqGetUnits, resGetUnits);
    assert.equal(resGetUnits.statusCode, 200, `Expected 200, got ${resGetUnits.statusCode}`);
    assert.equal(resGetUnits.data.source, 'SUPABASE', `Expected source SUPABASE`);
    console.log(`[PASS] Verified GET /api/units filtered by Base ID! Source: ${resGetUnits.data.source}`);

    // 5. Create Personnel
    console.log("\n[TEST 5] Creating Personnel in Supabase (POST /api/personnel)...");
    const reqP = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: {
        apfNo: testApf,
        rank: 'CSP',
        fullName: 'EMMANUEL OKONKWO',
        educationalQualification: 'BSC POLICE SCIENCE',
        stateOfOrigin: 'EDO',
        lga: 'BENIN CITY',
        tribe: 'BINI',
        geopoliticalZone: 'SOUTH SOUTH',
        dateOfBirth: '1978-05-15',
        dateOfEnlistment: '2000-02-01',
        dateOfLastPromotion: '2020-01-01',
        dateTransferredToCommand: '2022-01-01',
        dutyPost: 'UNIT COMMANDER',
        employeeCode: testEmp,
        ippisNumber: testIppis,
        baseId: createdBaseId,
        unitId: createdUnitId,
        accountNumber: '0123456789',
        bankName: 'POLICE MORTGAGE BANK',
        pfa: 'NPF PENSION',
        penPin: 'PEN-12345678',
        nhfNumber: 'NHF-87654321',
        emailAddress: 'emmanuel.okonkwo@npf.gov.ng',
        phoneNumber: '08031112233'
      }
    };
    const resP = mockRes();
    await personnelHandler(reqP, resP);
    assert.equal(resP.statusCode, 201, `Expected 201, got ${resP.statusCode}`);
    createdPersonnelId = resP.data.data.id;
    assert.ok(createdPersonnelId, 'Personnel ID must be returned');
    assert.equal(resP.data.data.baseId, createdBaseId, 'Returned baseId must equal created Base ID');
    assert.equal(resP.data.data.unitId, createdUnitId, 'Returned unitId must equal created Unit ID');
    console.log(`[PASS] Personnel created successfully in Supabase: ID ${createdPersonnelId}`);

    // 6. GET Personnel Reload & Foreign Key / Masking Verification
    console.log("\n[TEST 6] Verifying GET /api/personnel Reload & Foreign Key Relationships...");
    const reqGetP = { method: 'GET', headers: {} };
    const resGetP = mockRes();
    await personnelHandler(reqGetP, resGetP);
    assert.equal(resGetP.statusCode, 200, `Expected 200, got ${resGetP.statusCode}`);
    assert.equal(resGetP.data.source, 'SUPABASE', 'Expected source SUPABASE');
    const foundP = resGetP.data.data.find(p => (p.apfNo === testApf || p.apNo === testApf));
    assert.ok(foundP, 'Created personnel must exist in GET list after reload');
    assert.equal(foundP.baseId || foundP.base_id, createdBaseId, 'Reloaded base_id must match created base ID');
    assert.equal(foundP.unitId || foundP.unit_id, createdUnitId, 'Reloaded unit_id must match created unit ID');
    assert.equal(foundP.accountNumber, undefined, 'Bank Account Number must be masked/excluded in general list');
    assert.equal(foundP.ippisNumber, undefined, 'IPPIS Number must be masked/excluded in general list');
    console.log(`[PASS] Personnel verified in Supabase GET endpoint! FK base_id=${createdBaseId}, unit_id=${createdUnitId}. Financial fields masked.`);

    // 7. Duplicate AP/F/NO Prevention
    console.log("\n[TEST 7] Verifying Duplicate AP/F/NO Rejection...");
    const resDupP = mockRes();
    await personnelHandler(reqP, resDupP);
    assert.equal(resDupP.statusCode, 409, `Expected 409 Conflict, got ${resDupP.statusCode}`);
    console.log(`[PASS] Duplicate AP/F/NO rejected with 409 Conflict: '${resDupP.data.message}'`);

    // 8. Duplicate Base Code Prevention
    console.log("\n[TEST 8] Verifying Duplicate Base Code Rejection...");
    const resDupBase = mockRes();
    await basesHandler(reqBase, resDupBase);
    assert.equal(resDupBase.statusCode, 409, `Expected 409 Conflict, got ${resDupBase.statusCode}`);
    console.log(`[PASS] Duplicate Base Code rejected with 409 Conflict: '${resDupBase.data.message}'`);

    // 9. Duplicate Unit Code Prevention
    console.log("\n[TEST 9] Verifying Duplicate Unit Code Rejection...");
    const resDupUnit = mockRes();
    await unitsHandler(reqUnit, resDupUnit);
    assert.equal(resDupUnit.statusCode, 409, `Expected 409 Conflict, got ${resDupUnit.statusCode}`);
    console.log(`[PASS] Duplicate Unit Code rejected with 409 Conflict: '${resDupUnit.data.message}'`);

    // 10. RBAC Restriction
    console.log("\n[TEST 10] Verifying Unauthorized Role Restriction (403)...");
    const reqGuest = { method: 'POST', headers: { 'x-user-role': 'GUEST' }, body: reqP.body };
    const resGuest = mockRes();
    await personnelHandler(reqGuest, resGuest);
    assert.equal(resGuest.statusCode, 403, `Expected 403 Forbidden, got ${resGuest.statusCode}`);
    console.log(`[PASS] Unauthorized request rejected with 403 Forbidden: '${resGuest.data.message}'`);

  } finally {
    // Clean up in correct FK order: personnel_private -> personnel -> units -> bases
    console.log("\n[CLEANUP] Cleaning up test records in FK order...");
    if (createdPersonnelId) {
      const { error: privErr } = await supabase.from('personnel_private').delete().eq('personnel_id', createdPersonnelId);
      if (privErr) console.warn('[CLEANUP WARNING] personnel_private cleanup error:', privErr.message);
      const { error: pErr } = await supabase.from('personnel').delete().eq('id', createdPersonnelId);
      if (pErr) console.warn('[CLEANUP WARNING] personnel cleanup error:', pErr.message);
    }
    if (createdUnitId) {
      const { error: uErr } = await supabase.from('units').delete().eq('id', createdUnitId);
      if (uErr) console.warn('[CLEANUP WARNING] units cleanup error:', uErr.message);
    }
    if (createdBaseId) {
      const { error: bErr } = await supabase.from('bases').delete().eq('id', createdBaseId);
      if (bErr) console.warn('[CLEANUP WARNING] bases cleanup error:', bErr.message);
    }
    console.log("[CLEANUP] Cleanup completed.");
  }

  console.log("\n==========================================================================");
  console.log("ALL 10 NODE.JS SUPABASE PRODUCTION INTEGRATION TESTS PASSED STRICTLY!");
  console.log("==========================================================================");
}

runAllTests().catch(err => {
  console.error("TEST SUITE FAILED WITH EXCEPTION:", err);
  process.exit(1);
});
