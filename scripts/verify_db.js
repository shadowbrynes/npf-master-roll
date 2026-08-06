import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function verify() {
  const { data: bases } = await supabase.from('bases').select('*');
  const { data: units } = await supabase.from('units').select('*');

  const numberedBases = bases.filter(b => /^BASE-(0[1-9]|[12][0-9]|3[0-8])$/.test(b.base_code));
  const numberedUnits = units.filter(u => /^UNIT-(0[1-9]|[12][0-9]|3[0-8])$/.test(u.unit_code));

  console.log("=== SEED VERIFICATION ===");
  console.log("Total Bases in Supabase:", bases.length);
  console.log("Numbered Bases (BASE-01..BASE-38):", numberedBases.length);
  console.log("Total Units in Supabase:", units.length);
  console.log("Numbered Units (UNIT-01..UNIT-38):", numberedUnits.length);

  let unlinked = 0;
  numberedUnits.forEach(u => {
    const parentBase = bases.find(b => b.id === u.base_id);
    if (!parentBase) unlinked++;
  });
  console.log("Numbered Units without valid Base FK:", unlinked);

  // Check duplicates
  const baseCodes = bases.map(b => b.base_code);
  const unitCodes = units.map(u => u.unit_code);
  const baseDups = baseCodes.filter((item, index) => baseCodes.indexOf(item) !== index);
  const unitDups = unitCodes.filter((item, index) => unitCodes.indexOf(item) !== index);

  console.log("Duplicate Base Codes:", baseDups);
  console.log("Duplicate Unit Codes:", unitDups);
}

verify();
