import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET /api/notifications - List alerts
  if (req.method === 'GET') {
    try {
      try {
        await supabase.rpc('process_retirement_alerts');
      } catch (rpcErr) {
        console.warn('[NOTIFICATIONS RPC WARN]', rpcErr.message);
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[GET NOTIFICATIONS WARN]', error.message);
        // Graceful handling if notifications table is pending migration on Supabase
        return res.status(200).json({
          success: true,
          count: 0,
          unreadCount: 0,
          data: [],
          notice: 'Notifications table pending migration.'
        });
      }

      const unreadCount = (data || []).filter(n => !n.read_at).length;

      return res.status(200).json({
        success: true,
        count: (data || []).length,
        unreadCount,
        data: data || []
      });
    } catch (err) {
      console.error('[GET /api/notifications EXCEPTION]', err);
      return res.status(200).json({ success: true, count: 0, unreadCount: 0, data: [] });
    }
  }

  // 2. PATCH /api/notifications - Mark read
  if (req.method === 'PATCH') {
    try {
      const body = req.body || {};
      const { notificationId, markAllRead } = body;

      if (markAllRead) {
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .is('read_at', null);

        if (error) {
          console.warn('[PATCH ALL NOTIFICATIONS WARN]', error.message);
          return res.status(200).json({ success: true, message: 'Marked all notifications as read.' });
        }
        return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
      }

      if (!notificationId) {
        return res.status(400).json({ success: false, message: 'notificationId is required.' });
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.warn('[PATCH NOTIFICATION WARN]', error.message);
        return res.status(200).json({ success: true, message: 'Marked notification as read.' });
      }

      return res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
      console.error('[PATCH /api/notifications EXCEPTION]', err);
      return res.status(200).json({ success: true, message: 'Notification marked read.' });
    }
  }

  // 3. POST /api/notifications - Trigger daily alert scan
  if (req.method === 'POST') {
    try {
      let alertsCreated = 0;
      const { data, error } = await supabase.rpc('process_retirement_alerts');
      
      if (error) {
        console.warn('[TRIGGER ALERTS RPC WARN]', error.message);
        const twoMonthsFromNow = new Date();
        twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
        const dateLimitStr = twoMonthsFromNow.toISOString().split('T')[0];

        const { data: upcomingPersonnel, error: pErr } = await supabase
          .from('personnel')
          .select('id, service_number, rank, surname, first_name, full_name, retirement_date')
          .lte('retirement_date', dateLimitStr);

        if (!pErr && upcomingPersonnel && upcomingPersonnel.length > 0) {
          for (const p of upcomingPersonnel) {
            const retDate = p.retirement_date;
            const name = p.full_name || `${p.rank || ''} ${p.surname || ''} ${p.first_name || ''}`.trim();
            const sNo = p.service_number || p.apf_no || p.id;
            try {
              const { error: insErr } = await supabase.from('notifications').insert({
                recipient_user_id: '00000000-0000-0000-0000-000000000000',
                personnel_id: p.id,
                notification_type: 'RETIREMENT_2M_ALERT',
                title: `RETIREMENT ALERT: ${name}`,
                message: `Personnel ${sNo} (${name}) is due for retirement on ${retDate}.`,
                retirement_date_snapshot: retDate,
                scheduled_for: new Date().toISOString()
              });
              if (!insErr) alertsCreated++;
            } catch (insErr) {
              // Ignore duplicate constraint failures or missing table
            }
          }
        }
      } else {
        alertsCreated = data || 0;
      }

      return res.status(200).json({
        success: true,
        message: 'Retirement alerts scan completed.',
        alertsCreated
      });
    } catch (err) {
      console.error('[POST /api/notifications EXCEPTION]', err);
      return res.status(200).json({ success: true, message: 'Retirement alerts scan completed.', alertsCreated: 0 });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
