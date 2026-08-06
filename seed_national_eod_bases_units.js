import { supabase } from './api/_supabase.js';

async function seedData() {
  console.log("Seeding National EOD-CBRN Command Bases and Units into Supabase...");

  const bases = [
    { id: '11111111-1111-4111-a111-111111111111', base_code: 'EOD-HQ-00', base_name: 'NATIONAL EOD-CBRN COMMAND HEADQUARTERS, ABUJA', location: 'ABUJA', state: 'FCT', status: 'active' },
    { id: '22222222-2222-4222-a222-222222222222', base_code: 'EOD-BASE-01', base_name: 'APAPA SEA PORT EOD-CBRN TACTICAL BASE, LAGOS', location: 'LAGOS', state: 'LAGOS', status: 'active' },
    { id: '33333333-3333-4333-a333-333333333333', base_code: 'EOD-BASE-02', base_name: 'MAIDUGURI EOD-CBRN FORWARD OPERATING BASE, BORNO', location: 'MAIDUGURI', state: 'BORNO', status: 'active' },
    { id: '44444444-4444-4444-a444-444444444444', base_code: 'EOD-BASE-03', base_name: 'PORT HARCOURT EOD-CBRN TACTICAL BASE, RIVERS', location: 'PORT HARCOURT', state: 'RIVERS', status: 'active' },
    { id: '55555555-5555-4555-a555-555555555555', base_code: 'EOD-BASE-04', base_name: 'KANO EOD-CBRN COMMAND STATION, KANO', location: 'KANO', state: 'KANO', status: 'active' },
    { id: '66666666-6666-4666-a666-666666666666', base_code: 'EOD-BASE-05', base_name: 'ENUGU EOD-CBRN COMMAND STATION, ENUGU', location: 'ENUGU', state: 'ENUGU', status: 'active' },
    { id: '77777777-7777-4777-a777-777777777777', base_code: 'EOD-BASE-06', base_name: 'CALABAR EOD-CBRN MARITIME BASE, CROSS RIVER', location: 'CALABAR', state: 'CROSS RIVER', status: 'active' },
    { id: '88888888-8888-4888-a888-888888888888', base_code: 'EOD-BASE-07', base_name: 'SOKOTO EOD-CBRN COMMAND DETACHMENT, SOKOTO', location: 'SOKOTO', state: 'SOKOTO', status: 'active' }
  ];

  for (const b of bases) {
    const { error } = await supabase.from('bases').upsert(b, { onConflict: 'id' });
    if (error) console.error("Error seeding base", b.base_code, error.message);
    else console.log("Seeded Base:", b.base_code, b.base_name);
  }

  const units = [
    { id: 'a1111111-1111-4111-a111-111111111111', unit_code: 'OPS-01', unit_name: 'OPERATIONS & TACTICAL RESPONSE UNIT', base_id: '22222222-2222-4222-a222-222222222222', command_name: 'NATIONAL COMMAND', location: 'LAGOS', description: 'Tactical EOD response squad', status: 'active' },
    { id: 'a2222222-2222-4222-a222-222222222222', unit_code: 'INT-02', unit_name: 'CHEMICAL INTELLIGENCE & ANALYSIS UNIT', base_id: '11111111-1111-4111-a111-111111111111', command_name: 'NATIONAL COMMAND', location: 'ABUJA', description: 'Chemical intelligence & threat analysis squad', status: 'active' },
    { id: 'a3333333-3333-4333-a333-333333333333', unit_code: 'BOMB-03', unit_name: 'EOD DISPOSAL & DECONTAMINATION SQUAD', base_id: '22222222-2222-4222-a222-222222222222', command_name: 'NATIONAL COMMAND', location: 'LAGOS', description: 'Bomb disposal and decontamination unit', status: 'active' },
    { id: 'a4444444-4444-4444-a444-444444444444', unit_code: 'CBRN-04', unit_name: 'HAZMAT & RADIOLOGICAL DETECTION UNIT', base_id: '11111111-1111-4111-a111-111111111111', command_name: 'NATIONAL COMMAND', location: 'ABUJA', description: 'Radiological & biohazard detection squad', status: 'active' },
    { id: 'a5555555-5555-4555-a555-555555555555', unit_code: 'K9-05', unit_name: 'EOD CANINE & EXPLOSIVE DETECTION UNIT', base_id: '33333333-3333-4333-a333-333333333333', command_name: 'NATIONAL COMMAND', location: 'MAIDUGURI', description: 'K9 explosive detection squad', status: 'active' },
    { id: 'a6666666-6666-4666-a666-666666666666', unit_code: 'MAR-06', unit_name: 'MARITIME EOD & PORT SECURITY UNIT', base_id: '44444444-4444-4444-a444-444444444444', command_name: 'NATIONAL COMMAND', location: 'PORT HARCOURT', description: 'Maritime port security and underwater EOD squad', status: 'active' },
    { id: 'a7777777-7777-4777-a777-777777777777', unit_code: 'LOG-07', unit_name: 'LOGISTICS & TECHNICAL SUPPORT UNIT', base_id: '11111111-1111-4111-a111-111111111111', command_name: 'NATIONAL COMMAND', location: 'ABUJA', description: 'EOD equipment logistics and armory squad', status: 'active' }
  ];

  for (const u of units) {
    const { error } = await supabase.from('units').upsert(u, { onConflict: 'id' });
    if (error) console.error("Error seeding unit", u.unit_code, error.message);
    else console.log("Seeded Unit:", u.unit_code, u.unit_name);
  }

  console.log("Seeding complete!");
}

seedData();
