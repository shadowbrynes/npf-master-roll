import crypto from 'crypto';
import { supabase } from './api/_supabase.js';

const statesList = [
  { code: 'ABIA', name: 'Abia', cap: 'Umuahia' },
  { code: 'ADAMAWA', name: 'Adamawa', cap: 'Yola' },
  { code: 'AKWAIBOM', name: 'Akwa Ibom', cap: 'Uyo' },
  { code: 'ANAMBRA', name: 'Anambra', cap: 'Awka' },
  { code: 'BAUCHI', name: 'Bauchi', cap: 'Bauchi' },
  { code: 'BAYELSA', name: 'Bayelsa', cap: 'Yenagoa' },
  { code: 'BENUE', name: 'Benue', cap: 'Makurdi' },
  { code: 'BORNO', name: 'Borno', cap: 'Maiduguri' },
  { code: 'CROSSRIVER', name: 'Cross River', cap: 'Calabar' },
  { code: 'DELTA', name: 'Delta', cap: 'Asaba' },
  { code: 'EBONYI', name: 'Ebonyi', cap: 'Abakaliki' },
  { code: 'EDO', name: 'Edo', cap: 'Benin City' },
  { code: 'EKITI', name: 'Ekiti', cap: 'Ado-Ekiti' },
  { code: 'ENUGU', name: 'Enugu', cap: 'Enugu' },
  { code: 'FCT', name: 'FCT Abuja', cap: 'Abuja' },
  { code: 'GOMBE', name: 'Gombe', cap: 'Gombe' },
  { code: 'IMO', name: 'Imo', cap: 'Owerri' },
  { code: 'JIGAWA', name: 'Jigawa', cap: 'Dutse' },
  { code: 'KADUNA', name: 'Kaduna', cap: 'Kaduna' },
  { code: 'KANO', name: 'Kano', cap: 'Kano' },
  { code: 'KATSINA', name: 'Katsina', cap: 'Katsina' },
  { code: 'KEBBI', name: 'Kebbi', cap: 'Birnin Kebbi' },
  { code: 'KOGI', name: 'Kogi', cap: 'Lokoja' },
  { code: 'KWARA', name: 'Kwara', cap: 'Ilorin' },
  { code: 'LAGOS', name: 'Lagos', cap: 'Apapa / Ikeja' },
  { code: 'NASARAWA', name: 'Nasarawa', cap: 'Lafia' },
  { code: 'NIGER', name: 'Niger', cap: 'Minna' },
  { code: 'OGUN', name: 'Ogun', cap: 'Abeokuta' },
  { code: 'ONDO', name: 'Ondo', cap: 'Akure' },
  { code: 'OSUN', name: 'Osun', cap: 'Osogbo' },
  { code: 'OYO', name: 'Oyo', cap: 'Ibadan' },
  { code: 'PLATEAU', name: 'Plateau', cap: 'Jos' },
  { code: 'RIVERS', name: 'Rivers', cap: 'Port Harcourt' },
  { code: 'SOKOTO', name: 'Sokoto', cap: 'Sokoto' },
  { code: 'TARABA', name: 'Taraba', cap: 'Jalingo' },
  { code: 'YOBE', name: 'Yobe', cap: 'Damaturu' },
  { code: 'ZAMFARA', name: 'Zamfara', cap: 'Gusau' }
];

function generateUuid(seedStr) {
  const hash = crypto.createHash('md5').update(seedStr).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

async function seed36BasesAndUnits() {
  console.log("=== SEEDING ALL 36 AUTHORISED EOD-CBRN BASES AND UNITS ===");

  let basesCount = 0;
  let unitsCount = 0;

  for (const st of statesList) {
    const baseId = generateUuid(`BASE_${st.code}`);
    const baseCode = st.code === 'FCT' ? 'EOD-HQ-00' : (st.code === 'LAGOS' ? 'EOD-BASE-01' : `EOD-BASE-${st.code}`);
    const baseName = st.code === 'FCT' 
      ? 'NATIONAL EOD-CBRN COMMAND HEADQUARTERS, ABUJA'
      : (st.code === 'LAGOS' ? 'APAPA SEA PORT EOD-CBRN TACTICAL BASE, LAGOS' : `${st.name.toUpperCase()} EOD-CBRN TACTICAL BASE`);

    const baseRow = {
      id: baseId,
      base_code: baseCode,
      base_name: baseName,
      location: st.cap.toUpperCase(),
      state: st.name.toUpperCase(),
      status: 'active'
    };

    const { error: bErr } = await supabase.from('bases').upsert(baseRow, { onConflict: 'base_code' });
    if (bErr) {
      console.error(`Error upserting base ${baseCode}:`, bErr.message);
    } else {
      basesCount++;
    }

    // Units for this base
    const unitConfigs = [
      { codeSuffix: 'OPS', nameSuffix: 'OPERATIONS & TACTICAL RESPONSE SQUAD', desc: 'Tactical EOD response squad' },
      { codeSuffix: 'INT', nameSuffix: 'CBRN INTELLIGENCE & RECONNAISSANCE UNIT', desc: 'CBRN threat intelligence squad' },
      { codeSuffix: 'BOMB', nameSuffix: 'BOMB DISPOSAL & DECONTAMINATION SQUAD', desc: 'EOD disposal & hazmat decontamination squad' }
    ];

    for (const uCfg of unitConfigs) {
      const unitCode = `${uCfg.codeSuffix}-${st.code}`;
      const unitId = generateUuid(`UNIT_${unitCode}`);
      const unitName = `${st.name.toUpperCase()} ${uCfg.nameSuffix}`;

      const unitRow = {
        id: unitId,
        unit_code: unitCode,
        unit_name: unitName,
        base_id: baseId,
        command_name: 'NATIONAL EOD-CBRN COMMAND',
        location: st.cap.toUpperCase(),
        description: uCfg.desc,
        status: 'active'
      };

      const { error: uErr } = await supabase.from('units').upsert(unitRow, { onConflict: 'unit_code' });
      if (uErr) {
        console.error(`Error upserting unit ${unitCode}:`, uErr.message);
      } else {
        unitsCount++;
      }
    }
  }

  console.log(`\nSUCCESS: Seeded ${basesCount} bases and ${unitsCount} units into Supabase PostgreSQL.`);
}

seed36BasesAndUnits();
