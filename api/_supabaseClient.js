const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function supabaseRest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[SUPABASE REST ${options.method || 'GET'} ${endpoint} FAILED]`, res.status, errText);
      return { success: false, status: res.status, error: errText };
    }

    const data = await res.json();
    return { success: true, status: res.status, data };
  } catch (err) {
    console.error('[SUPABASE FETCH EXCEPTION]', err.message);
    return { success: false, status: 500, error: err.message };
  }
}
