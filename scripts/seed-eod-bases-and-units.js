import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY environment variables are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

function generateUuid(seedStr) {
  const hash = crypto.createHash('md5').update(seedStr).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

async function seedBasesAndUnits() {
  console.log("=== SEEDING TEMPORARY NUMBERED BASES (01-38) AND UNITS (01-38) ===");

  try {
    const basesPayload = [];
    for (let i = 1; i <= 38; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const code = `BASE-${numStr}`;
      const name = `EOD-CBRN BASE ${numStr}`;
      basesPayload.push({
        id: generateUuid(code),
        base_code: code,
        base_name: name,
        location: `LOCATION ${numStr}`,
        state: `STATE ${numStr}`,
        status: 'active'
      });
    }

    // 1. Upsert bases by base_code
    for (const b of basesPayload) {
      const { error } = await supabase
        .from('bases')
        .upsert(b, { onConflict: 'base_code' });
      if (error) {
        console.error(`FAILED to upsert base ${b.base_code}:`, error.message);
        process.exit(1);
      }
    }

    // 2. Fetch created bases to get their UUIDs
    const { data: dbBases, error: fetchErr } = await supabase
      .from('bases')
      .select('id, base_code');
    
    if (fetchErr || !dbBases) {
      console.error("FAILED to fetch bases after upsert:", fetchErr ? fetchErr.message : "No bases returned");
      process.exit(1);
    }

    const baseMap = new Map();
    dbBases.forEach(b => baseMap.set(b.base_code, b.id));

    // 3. Upsert units by unit_code linked to base UUIDs
    const unitsPayload = [];
    for (let i = 1; i <= 38; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const baseCode = `BASE-${numStr}`;
      const unitCode = `UNIT-${numStr}`;
      const unitName = `EOD-CBRN UNIT ${numStr}`;
      const baseId = baseMap.get(baseCode);

      if (!baseId) {
        console.error(`FAILED to find base UUID for ${baseCode}`);
        process.exit(1);
      }

      unitsPayload.push({
        id: generateUuid(unitCode),
        unit_code: unitCode,
        unit_name: unitName,
        base_id: baseId,
        command_name: 'NATIONAL EOD-CBRN COMMAND',
        location: `LOCATION ${numStr}`,
        description: 'Temporary numbered record awaiting authorised EOD-CBRN location details.',
        status: 'active'
      });
    }

    for (const u of unitsPayload) {
      const { error } = await supabase
        .from('units')
        .upsert(u, { onConflict: 'unit_code' });
      if (error) {
        console.error(`FAILED to upsert unit ${u.unit_code}:`, error.message);
        process.exit(1);
      }
    }

    // 4. Verify counts
    const { count: baseCount, error: bCntErr } = await supabase.from('bases').select('*', { count: 'exact', head: true });
    const { count: unitCount, error: uCntErr } = await supabase.from('units').select('*', { count: 'exact', head: true });

    if (bCntErr || uCntErr) {
      console.error("FAILED to retrieve final counts:", bCntErr || uCntErr);
      process.exit(1);
    }

    console.log(`\nFINAL BASE COUNT IN SUPABASE: ${baseCount}`);
    console.log(`FINAL UNIT COUNT IN SUPABASE: ${unitCount}`);
    console.log("Seeding completed successfully with 0 errors!");

  } catch (err) {
    console.error("FATAL SEED EXCEPTION:", err);
    process.exit(1);
  }
}

seedBasesAndUnits();
