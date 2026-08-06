import assert from 'node:assert/strict';
import { supabase } from './api/_supabase.js';
import baseHandler from './api/bases.js';

function createMockReqRes(method, body = {}, headers = {}, query = {}) {
  const req = {
    method,
    body,
    headers: { 'content-type': 'application/json', ...headers },
    query
  };
  let resData = null;
  let statusCode = 200;
  const resHeaders = {};

  const res = {
    setHeader(key, val) { resHeaders[key] = val; },
    status(code) { statusCode = code; return res; },
    json(data) { resData = data; return res; },
    end() { return res; }
  };

  return { req, res, getStatus: () => statusCode, getData: () => resData };
}

async function runAddBaseTests() {
  console.log("==========================================================================");
  console.log("RUNNING ADD BASE FEATURE TEST SUITE");
  console.log("==========================================================================");

  // Clean up any test base BASE-999 before starting
  await supabase.from('bases').delete().eq('base_code', 'BASE-999');

  // TEST 1: BASE 999 normalises to BASE-999 and saves successfully (201)
  console.log("\n[TEST 1] Normalising 'BASE 999' -> 'BASE-999' and saving...");
  const t1 = createMockReqRes('POST', { baseCode: 'BASE 999', baseName: 'UYO EOD-CBRN BASE' }, { 'x-user-role': 'GLOBAL_ADMIN' });
  await baseHandler(t1.req, t1.res);
  assert.equal(t1.getStatus(), 201, "Expected HTTP 201 Created for valid base creation.");
  assert.equal(t1.getData().success, true);
  assert.equal(t1.getData().data.base_code, 'BASE-999');
  console.log("[PASS] 'BASE 999' normalised to 'BASE-999' and created successfully! ID:", t1.getData().data.id);

  // TEST 2: Duplicate BASE-999 returns HTTP 409 Conflict
  console.log("\n[TEST 2] Verifying duplicate 'BASE-999' rejection (409 Conflict)...");
  const t2 = createMockReqRes('POST', { baseCode: 'base-999', baseName: 'UYO EOD-CBRN BASE' }, { 'x-user-role': 'GLOBAL_ADMIN' });
  await baseHandler(t2.req, t2.res);
  assert.equal(t2.getStatus(), 409, "Expected HTTP 409 Conflict for duplicate base code.");
  assert.equal(t2.getData().success, false);
  assert.equal(t2.getData().message, "Base Code BASE-999 already exists.");
  console.log("[PASS] Duplicate 'base-999' rejected with HTTP 409:", t2.getData().message);

  // TEST 3: Empty code returns HTTP 400 Bad Request
  console.log("\n[TEST 3] Verifying empty Base Code rejection (400 Bad Request)...");
  const t3 = createMockReqRes('POST', { baseCode: '', baseName: 'UYO EOD-CBRN BASE' }, { 'x-user-role': 'GLOBAL_ADMIN' });
  await baseHandler(t3.req, t3.res);
  assert.equal(t3.getStatus(), 400, "Expected HTTP 400 Bad Request for empty base code.");
  assert.equal(t3.getData().success, false);
  console.log("[PASS] Empty base code rejected with HTTP 400:", t3.getData().message);

  // TEST 4: Empty name returns HTTP 400 Bad Request
  console.log("\n[TEST 4] Verifying empty Base Name rejection (400 Bad Request)...");
  const t4 = createMockReqRes('POST', { baseCode: 'BASE-888', baseName: '  ' }, { 'x-user-role': 'GLOBAL_ADMIN' });
  await baseHandler(t4.req, t4.res);
  assert.equal(t4.getStatus(), 400, "Expected HTTP 400 Bad Request for empty base name.");
  assert.equal(t4.getData().success, false);
  console.log("[PASS] Empty base name rejected with HTTP 400:", t4.getData().message);

  // TEST 5: Unauthorized role returns HTTP 403 Forbidden
  console.log("\n[TEST 5] Verifying unauthorized role rejection (403 Forbidden)...");
  const t5 = createMockReqRes('POST', { baseCode: 'BASE-777', baseName: 'UNAUTHORIZED BASE' }, { 'x-user-role': 'GUEST' });
  await baseHandler(t5.req, t5.res);
  assert.equal(t5.getStatus(), 403, "Expected HTTP 403 Forbidden for unauthorized role.");
  assert.equal(t5.getData().success, false);
  console.log("[PASS] Unauthorized role rejected with HTTP 403:", t5.getData().message);

  // TEST 6: GET /api/bases contains newly created base
  console.log("\n[TEST 6] Verifying GET /api/bases includes newly created base...");
  const t6 = createMockReqRes('GET');
  await baseHandler(t6.req, t6.res);
  assert.equal(t6.getStatus(), 200);
  const found = t6.getData().data.find(b => b.base_code === 'BASE-999');
  assert.ok(found, "Newly created base BASE-999 must appear in GET /api/bases.");
  console.log("[PASS] BASE-999 found in GET /api/bases list!");

  // CLEANUP
  console.log("\n[CLEANUP] Removing test base BASE-999...");
  await supabase.from('bases').delete().eq('base_code', 'BASE-999');
  console.log("[CLEANUP] Test base cleaned up.");

  console.log("\n==========================================================================");
  console.log("ALL 6 ADD BASE TEST CASES PASSED STRICTLY!");
  console.log("==========================================================================");
}

runAddBaseTests().catch(err => {
  console.error("TEST SUITE FAILED:", err);
  process.exit(1);
});
