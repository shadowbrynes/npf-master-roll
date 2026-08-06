import crypto from 'crypto';
import { supabase } from './api/_supabase.js';

const bases1to38 = [
  { num: 1, code: 'BASE-01', name: 'ABIA EOD-CBRN TACTICAL BASE 01', state: 'ABIA', loc: 'UMUAHIA' },
  { num: 2, code: 'BASE-02', name: 'ADAMAWA EOD-CBRN TACTICAL BASE 02', state: 'ADAMAWA', loc: 'YOLA' },
  { num: 3, code: 'BASE-03', name: 'AKWA IBOM EOD-CBRN TACTICAL BASE 03', state: 'AKWA IBOM', loc: 'UYO' },
  { num: 4, code: 'BASE-04', name: 'ANAMBRA EOD-CBRN TACTICAL BASE 04', state: 'ANAMBRA', loc: 'AWKA' },
  { num: 5, code: 'BASE-05', name: 'BAUCHI EOD-CBRN TACTICAL BASE 05', state: 'BAUCHI', loc: 'BAUCHI' },
  { num: 6, code: 'BASE-06', name: 'BAYELSA EOD-CBRN TACTICAL BASE 06', state: 'BAYELSA', loc: 'YENAGOA' },
  { num: 7, code: 'BASE-07', name: 'BENUE EOD-CBRN TACTICAL BASE 07', state: 'BENUE', loc: 'MAKURDI' },
  { num: 8, code: 'BASE-08', name: 'BORNO EOD-CBRN TACTICAL BASE 08', state: 'BORNO', loc: 'MAIDUGURI' },
  { num: 9, code: 'BASE-09', name: 'CROSS RIVER EOD-CBRN TACTICAL BASE 09', state: 'CROSS RIVER', loc: 'CALABAR' },
  { num: 10, code: 'BASE-10', name: 'DELTA EOD-CBRN TACTICAL BASE 10', state: 'DELTA', loc: 'ASABA' },
  { num: 11, code: 'BASE-11', name: 'EBONYI EOD-CBRN TACTICAL BASE 11', state: 'EBONYI', loc: 'ABAKALIKI' },
  { num: 12, code: 'BASE-12', name: 'EDO EOD-CBRN TACTICAL BASE 12', state: 'EDO', loc: 'BENIN CITY' },
  { num: 13, code: 'BASE-13', name: 'EKITI EOD-CBRN TACTICAL BASE 13', state: 'EKITI', loc: 'ADO-EKITI' },
  { num: 14, code: 'BASE-14', name: 'ENUGU EOD-CBRN TACTICAL BASE 14', state: 'ENUGU', loc: 'ENUGU' },
  { num: 15, code: 'BASE-15', name: 'GOMBE EOD-CBRN TACTICAL BASE 15', state: 'GOMBE', loc: 'GOMBE' },
  { num: 16, code: 'BASE-16', name: 'IMO EOD-CBRN TACTICAL BASE 16', state: 'IMO', loc: 'OWERRI' },
  { num: 17, code: 'BASE-17', name: 'JIGAWA EOD-CBRN TACTICAL BASE 17', state: 'JIGAWA', loc: 'DUTSE' },
  { num: 18, code: 'BASE-18', name: 'KADUNA EOD-CBRN TACTICAL BASE 18', state: 'KADUNA', loc: 'KADUNA' },
  { num: 19, code: 'BASE-19', name: 'KANO EOD-CBRN TACTICAL BASE 19', state: 'KANO', loc: 'KANO' },
  { num: 20, code: 'BASE-20', name: 'KATSINA EOD-CBRN TACTICAL BASE 20', state: 'KATSINA', loc: 'KATSINA' },
  { num: 21, code: 'BASE-21', name: 'KEBBI EOD-CBRN TACTICAL BASE 21', state: 'KEBBI', loc: 'BIRNIN KEBBI' },
  { num: 22, code: 'BASE-22', name: 'KOGI EOD-CBRN TACTICAL BASE 22', state: 'KOGI', loc: 'LOKOJA' },
  { num: 23, code: 'BASE-23', name: 'KWARA EOD-CBRN TACTICAL BASE 23', state: 'KWARA', loc: 'ILORIN' },
  { num: 24, code: 'BASE-24', name: 'LAGOS APAPA SEA PORT EOD-CBRN TACTICAL BASE 24', state: 'LAGOS', loc: 'APAPA / IKEJA' },
  { num: 25, code: 'BASE-25', name: 'NASARAWA EOD-CBRN TACTICAL BASE 25', state: 'NASARAWA', loc: 'LAFIA' },
  { num: 26, code: 'BASE-26', name: 'NIGER EOD-CBRN TACTICAL BASE 26', state: 'NIGER', loc: 'MINNA' },
  { num: 27, code: 'BASE-27', name: 'OGUN EOD-CBRN TACTICAL BASE 27', state: 'OGUN', loc: 'ABEOKUTA' },
  { num: 28, code: 'BASE-28', name: 'ONDO EOD-CBRN TACTICAL BASE 28', state: 'ONDO', loc: 'AKURE' },
  { num: 29, code: 'BASE-29', name: 'OSUN EOD-CBRN TACTICAL BASE 29', state: 'OSUN', loc: 'OSOGBO' },
  { num: 30, code: 'BASE-30', name: 'OYO EOD-CBRN TACTICAL BASE 30', state: 'OYO', loc: 'IBADAN' },
  { num: 31, code: 'BASE-31', name: 'PLATEAU EOD-CBRN TACTICAL BASE 31', state: 'PLATEAU', loc: 'JOS' },
  { num: 32, code: 'BASE-32', name: 'RIVERS PORT HARCOURT EOD-CBRN TACTICAL BASE 32', state: 'RIVERS', loc: 'PORT HARCOURT' },
  { num: 33, code: 'BASE-33', name: 'SOKOTO EOD-CBRN TACTICAL BASE 33', state: 'SOKOTO', loc: 'SOKOTO' },
  { num: 34, code: 'BASE-34', name: 'TARABA EOD-CBRN TACTICAL BASE 34', state: 'TARABA', loc: 'JALINGO' },
  { num: 35, code: 'BASE-35', name: 'YOBE EOD-CBRN TACTICAL BASE 35', state: 'YOBE', loc: 'DAMATURU' },
  { num: 36, code: 'BASE-36', name: 'ZAMFARA EOD-CBRN TACTICAL BASE 36', state: 'ZAMFARA', loc: 'GUSAU' },
  { num: 37, code: 'BASE-37', name: 'FCT NATIONAL EOD-CBRN COMMAND HEADQUARTERS BASE 37', state: 'FCT', loc: 'ABUJA' },
  { num: 38, code: 'BASE-38', name: 'STRATEGIC HIGH THREAT SPECIAL RESPONSE BASE 38', state: 'NATIONAL', loc: 'HEADQUARTERS' }
];

function generateUuid(seedStr) {
  const hash = crypto.createHash('md5').update(seedStr).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

async function seedBase1to38() {
  console.log("=== SEEDING BASES BASE-01 TO BASE-38 INTO SUPABASE POSTGRESQL ===");

  let successCount = 0;
  for (const b of bases1to38) {
    const baseId = generateUuid(`BASE_NUM_${b.num}`);
    const row = {
      id: baseId,
      base_code: b.code,
      base_name: b.name,
      state: b.state,
      location: b.loc,
      status: 'active'
    };

    const { data, error } = await supabase.from('bases').upsert(row, { onConflict: 'base_code' }).select();
    if (error) {
      console.error(`Error inserting ${b.code}:`, error.message);
    } else {
      console.log(`[SUCCESS] ${b.code} -> ${b.name}`);
      successCount++;
    }
  }

  console.log(`\n==========================================================================`);
  console.log(`SUCCESSFULLY SEEDED ALL ${successCount} BASES (BASE-01 TO BASE-38) INTO SUPABASE!`);
  console.log(`==========================================================================`);
}

seedBase1to38();
