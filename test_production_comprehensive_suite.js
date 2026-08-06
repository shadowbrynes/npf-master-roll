import assert from 'node:assert/strict';
import basesHandler from './api/bases.js';
import unitsHandler from './api/units.js';
import personnelHandler from './api/personnel.js';
import calculatorHandler from './api/retirement-calculator.js';
import policiesHandler from './api/retirement-policies.js';
import notificationsHandler from './api/notifications.js';
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

async function runComprehensiveTests() {
  console.log("==========================================================================");
  console.log("RUNNING COMPREHENSIVE PRODUCTION AUTOMATED TEST SUITE");
  console.log("==========================================================================");

  let createdBaseId = null;
  let createdUnitId = null;
  let createdPersonnelId = null;

  try {
    // -------------------------------------------------------------------------
    // CATEGORY 1: RETIREMENT CALCULATIONS
    // -------------------------------------------------------------------------
    console.log("\n--- CATEGORY 1: RETIREMENT CALCULATIONS ---");

    // Test 1.1: Retirement by age occurs first
    console.log("[TEST 1.1] Testing Age Rule Occurs First (DOB: 1965-05-15, Appointment: 1995-01-01)...");
    const reqCalc1 = { method: 'GET', query: { dateOfBirth: '1965-05-15', dateOfFirstAppointment: '1995-01-01', retirementAge: 60, maximumServiceYears: 35 } };
    const resCalc1 = mockRes();
    await calculatorHandler(reqCalc1, resCalc1);
    assert.equal(resCalc1.statusCode, 200);
    assert.equal(resCalc1.data.data.finalRetirementDate, '2025-05-15', 'Expected DOB + 60 = 2025-05-15');
    assert.equal(resCalc1.data.data.producingRule, 'AGE_LIMIT_REACHED');
    console.log('[PASS] Age limit calculation verified: 2025-05-15');

    // Test 1.2: Retirement by service occurs first
    console.log("[TEST 1.2] Testing Service Rule Occurs First (DOB: 1980-08-20, Appointment: 2000-06-10)...");
    const reqCalc2 = { method: 'GET', query: { dateOfBirth: '1980-08-20', dateOfFirstAppointment: '2000-06-10', retirementAge: 60, maximumServiceYears: 35 } };
    const resCalc2 = mockRes();
    await calculatorHandler(reqCalc2, resCalc2);
    assert.equal(resCalc2.statusCode, 200);
    assert.equal(resCalc2.data.data.finalRetirementDate, '2035-06-10', 'Expected Enlistment + 35 = 2035-06-10');
    assert.equal(resCalc2.data.data.producingRule, 'MAX_SERVICE_YEARS_REACHED');
    console.log('[PASS] Service limit calculation verified: 2035-06-10');

    // Test 1.3: Both dates equal
    console.log("[TEST 1.3] Testing Both Dates Equal (DOB: 1970-01-01, Appointment: 1995-01-01)...");
    const reqCalc3 = { method: 'GET', query: { dateOfBirth: '1970-01-01', dateOfFirstAppointment: '1995-01-01', retirementAge: 60, maximumServiceYears: 35 } };
    const resCalc3 = mockRes();
    await calculatorHandler(reqCalc3, resCalc3);
    assert.equal(resCalc3.statusCode, 200);
    assert.equal(resCalc3.data.data.finalRetirementDate, '2030-01-01');
    console.log('[PASS] Equal dates calculation verified: 2030-01-01');

    // Test 1.4: Leap day date of birth (1968-02-29 + 60 years = 2028-02-29 in leap year 2028)
    console.log("[TEST 1.4] Testing Leap Day Date of Birth (DOB: 1968-02-29)...");
    const reqCalc4 = { method: 'GET', query: { dateOfBirth: '1968-02-29', dateOfFirstAppointment: '1998-02-28', retirementAge: 60, maximumServiceYears: 35 } };
    const resCalc4 = mockRes();
    await calculatorHandler(reqCalc4, resCalc4);
    assert.equal(resCalc4.statusCode, 200);
    assert.equal(resCalc4.data.data.finalRetirementDate, '2028-02-29');
    console.log('[PASS] Leap day DOB calculation verified: 2028-02-29');

    // Test 1.5: Missing dates rejection
    console.log("[TEST 1.5] Testing Missing Dates Rejection...");
    const reqCalc5 = { method: 'GET', query: { dateOfBirth: '1980-01-01' } };
    const resCalc5 = mockRes();
    await calculatorHandler(reqCalc5, resCalc5);
    assert.equal(resCalc5.statusCode, 400);
    console.log('[PASS] Missing appointment date rejected with HTTP 400.');

    // -------------------------------------------------------------------------
    // CATEGORY 2: DATABASE & RLS ROLE PERMISSIONS
    // -------------------------------------------------------------------------
    console.log("\n--- CATEGORY 2: DATABASE & RLS ROLE PERMISSIONS ---");

    const ts = Date.now().toString().slice(-6);
    const testBaseCode = `BASE-COMP-${ts}`;
    const testUnitCode = `UNIT-COMP-${ts}`;
    const testApf = `AP/COMP/${ts}`;

    // Test 2.1: Global Administrator Base Creation
    console.log("[TEST 2.1] Global Admin Base Creation (POST /api/bases)...");
    const reqBase = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: { baseCode: testBaseCode, baseName: `LAGOS COMMAND BASE ${testBaseCode}`, location: 'LAGOS', state: 'LAGOS' }
    };
    const resBase = mockRes();
    await basesHandler(reqBase, resBase);
    assert.equal(resBase.statusCode, 201);
    createdBaseId = resBase.data.data.id;
    console.log(`[PASS] Base created by Global Admin: ID ${createdBaseId}`);

    // Test 2.2: Viewer Role Base Creation Rejection (403)
    console.log("[TEST 2.2] Viewer Base Creation Rejection (POST /api/bases)...");
    const reqBaseViewer = {
      method: 'POST',
      headers: { 'x-user-role': 'viewer' },
      body: { baseCode: `BASE-FAIL-${ts}`, baseName: 'FAIL BASE' }
    };
    const resBaseViewer = mockRes();
    await basesHandler(reqBaseViewer, resBaseViewer);
    assert.equal(resBaseViewer.statusCode, 403);
    console.log('[PASS] Viewer role correctly restricted with HTTP 403 Forbidden.');

    // Test 2.3: Unit Creation under Base
    console.log("[TEST 2.3] Unit Creation under Base (POST /api/units)...");
    const reqUnit = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: { unitCode: testUnitCode, unitName: `TACTICAL UNIT ${testUnitCode}`, baseId: createdBaseId }
    };
    const resUnit = mockRes();
    await unitsHandler(reqUnit, resUnit);
    assert.equal(resUnit.statusCode, 201);
    createdUnitId = resUnit.data.data.id;
    console.log(`[PASS] Unit created under Base: ID ${createdUnitId}`);

    // Test 2.4: Personnel Creation under Base & Unit
    console.log("[TEST 2.4] Personnel Creation under Base & Unit (POST /api/personnel)...");
    const reqP = {
      method: 'POST',
      headers: { 'x-user-role': 'GLOBAL_ADMIN' },
      body: {
        apfNo: testApf,
        rank: 'INSPR',
        fullName: 'OFFICER SAMUEL OKON',
        dateOfBirth: '1975-04-12',
        dateOfEnlistment: '1998-07-01',
        stateOfOrigin: 'AKWA IBOM',
        baseId: createdBaseId,
        unitId: createdUnitId
      }
    };
    const resP = mockRes();
    await personnelHandler(reqP, resP);
    assert.equal(resP.statusCode, 201);
    createdPersonnelId = resP.data.data.id;
    console.log(`[PASS] Personnel record created: ID ${createdPersonnelId}`);

    // -------------------------------------------------------------------------
    // CATEGORY 3: NOTIFICATIONS & ALERTS
    // -------------------------------------------------------------------------
    console.log("\n--- CATEGORY 3: NOTIFICATIONS & ALERTS ---");

    // Test 3.1: Trigger Retirement Alerts Scan
    console.log("[TEST 3.1] Triggering Retirement Alerts Scan (POST /api/notifications)...");
    const reqNotifScan = { method: 'POST', headers: {} };
    const resNotifScan = mockRes();
    await notificationsHandler(reqNotifScan, resNotifScan);
    assert.equal(resNotifScan.statusCode, 200);
    console.log(`[PASS] Alerts scan executed successfully. Alerts Created: ${resNotifScan.data.alertsCreated}`);

    // Test 3.2: Fetch Notifications
    console.log("[TEST 3.2] Fetching Notifications (GET /api/notifications)...");
    const reqGetNotif = { method: 'GET', headers: {} };
    const resGetNotif = mockRes();
    await notificationsHandler(reqGetNotif, resGetNotif);
    assert.equal(resGetNotif.statusCode, 200);
    console.log(`[PASS] Notifications loaded. Count: ${resGetNotif.data.count}, Unread: ${resGetNotif.data.unreadCount}`);

    // -------------------------------------------------------------------------
    // CATEGORY 4: END-TO-END DATA PERSISTENCE AFTER REFRESH
    // -------------------------------------------------------------------------
    console.log("\n--- CATEGORY 4: DATA PERSISTENCE VERIFICATION ---");

    console.log("[TEST 4.1] Verifying Data Persistence in Database after Simulated Refresh...");
    const reqGetPersonnel = { method: 'GET', headers: {} };
    const resGetPersonnel = mockRes();
    await personnelHandler(reqGetPersonnel, resGetPersonnel);
    assert.equal(resGetPersonnel.statusCode, 200);

    const foundOfficer = resGetPersonnel.data.data.find(p => p.id === createdPersonnelId);
    assert.ok(foundOfficer, 'Created officer must persist in database GET endpoint');
    assert.equal(foundOfficer.baseId, createdBaseId, 'Base FK relationship preserved');
    assert.equal(foundOfficer.unitId, createdUnitId, 'Unit FK relationship preserved');
    console.log(`[PASS] Verified persistent officer record in database: ${foundOfficer.apfNo} (${foundOfficer.name})`);

    // CLEANUP
    console.log("\n[CLEANUP] Cleaning up test records in strict FK order...");
    if (createdPersonnelId) {
      await supabase.from('personnel_private').delete().eq('personnel_id', createdPersonnelId);
      await supabase.from('personnel').delete().eq('id', createdPersonnelId);
    }
    if (createdUnitId) {
      await supabase.from('units').delete().eq('id', createdUnitId);
    }
    if (createdBaseId) {
      await supabase.from('bases').delete().eq('id', createdBaseId);
    }
    console.log('[CLEANUP] FK Order Cleanup Completed.');

    console.log("==========================================================================");
    console.log("ALL COMPREHENSIVE PRODUCTION TESTS PASSED STRICTLY!");
    console.log("==========================================================================");

  } catch (err) {
    console.error('[TEST SUITE EXCEPTION]', err);
    // Cleanup on failure
    if (createdPersonnelId) await supabase.from('personnel').delete().eq('id', createdPersonnelId);
    if (createdUnitId) await supabase.from('units').delete().eq('id', createdUnitId);
    if (createdBaseId) await supabase.from('bases').delete().eq('id', createdBaseId);
    process.exit(1);
  }
}

runComprehensiveTests();
