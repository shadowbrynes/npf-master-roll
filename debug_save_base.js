import basesHandler from './api/bases.js';

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

async function debugSaveBase() {
  const ts = Date.now().toString().slice(-4);
  const testCode = `BASE-DBG-${ts}`;
  const req = {
    method: 'POST',
    headers: { 'x-user-role': 'GLOBAL_ADMIN' },
    body: { baseCode: testCode, baseName: `DEBUG BASE ${ts}` }
  };
  const res = mockRes();

  console.log("SENDING POST /api/bases REQ:", req.body);
  await basesHandler(req, res);
  console.log("RESPONSE STATUS:", res.statusCode);
  console.log("RESPONSE DATA:", res.data);
}

debugSaveBase();
