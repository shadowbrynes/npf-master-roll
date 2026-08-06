function parseYMD(dateStr) {
  const parts = String(dateStr || '').trim().split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m, day: d };
}

function formatDateYMD(year, month, day) {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addYearsSafely(dateStr, years) {
  const parsed = parseYMD(dateStr);
  if (!parsed) return null;
  let targetYear = parsed.year + years;
  let targetMonth = parsed.month;
  let targetDay = parsed.day;

  const maxDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  if (targetDay > maxDaysInMonth) {
    targetDay = maxDaysInMonth;
  }

  return { year: targetYear, month: targetMonth, day: targetDay, dateStr: formatDateYMD(targetYear, targetMonth, targetDay) };
}

function subtractMonthsSafely(ymdObj, months) {
  let targetYear = ymdObj.year;
  let targetMonth = ymdObj.month - months;
  let targetDay = ymdObj.day;

  while (targetMonth < 0) {
    targetMonth += 12;
    targetYear -= 1;
  }

  const maxDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  if (targetDay > maxDaysInMonth) {
    targetDay = maxDaysInMonth;
  }

  return { year: targetYear, month: targetMonth, day: targetDay, dateStr: formatDateYMD(targetYear, targetMonth, targetDay) };
}

function calculateDiffYMD(startDateStr, endDateStr) {
  const start = parseYMD(startDateStr);
  const end = parseYMD(endDateStr);
  if (!start || !end) return { years: 0, months: 0, days: 0, isPast: true };

  const startVal = start.year * 10000 + start.month * 100 + start.day;
  const endVal = end.year * 10000 + end.month * 100 + end.day;

  if (endVal < startVal) {
    return { years: 0, months: 0, days: 0, isPast: true };
  }

  let years = end.year - start.year;
  let months = end.month - start.month;
  let days = end.day - start.day;

  if (days < 0) {
    months--;
    const prevMonthEnd = new Date(end.year, end.month, 0).getDate();
    days += prevMonthEnd;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days, isPast: false };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const params = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const { dateOfBirth, dateOfFirstAppointment, retirementAge = 60, maximumServiceYears = 35, noticeMonths = 2 } = params;

    if (!dateOfBirth || !dateOfFirstAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Both Date of Birth (dateOfBirth) and Date of First Appointment (dateOfFirstAppointment) are required.'
      });
    }

    const ageRuleYears = parseInt(retirementAge, 10);
    const serviceRuleYears = parseInt(maximumServiceYears, 10);
    const notice = parseInt(noticeMonths, 10);

    const retirementByAge = addYearsSafely(dateOfBirth, ageRuleYears);
    const retirementByService = addYearsSafely(dateOfFirstAppointment, serviceRuleYears);

    if (!retirementByAge || !retirementByService) {
      return res.status(400).json({ success: false, message: 'Invalid Date of Birth or Date of First Appointment format.' });
    }

    let finalRetirementObj = retirementByAge;
    let producingRule = 'AGE_LIMIT_REACHED';

    if (retirementByService.dateStr < retirementByAge.dateStr) {
      finalRetirementObj = retirementByService;
      producingRule = 'MAX_SERVICE_YEARS_REACHED';
    } else if (retirementByService.dateStr === retirementByAge.dateStr) {
      producingRule = 'BOTH_AGE_AND_SERVICE_EQUAL';
    }

    const alertObj = subtractMonthsSafely(finalRetirementObj, notice);

    const todayStr = new Date().toISOString().split('T')[0];
    const remaining = calculateDiffYMD(todayStr, finalRetirementObj.dateStr);

    let status = 'active';
    if (todayStr >= finalRetirementObj.dateStr) {
      status = 'retired';
    } else if (todayStr >= alertObj.dateStr) {
      const todayDate = new Date(todayStr);
      const finalDate = new Date(finalRetirementObj.dateStr);
      const daysLeft = Math.ceil((finalDate - todayDate) / (1000 * 60 * 60 * 24));
      status = daysLeft <= 30 ? 'retiring_within_30_days' : 'retirement_approaching';
    }

    return res.status(200).json({
      success: true,
      data: {
        dateOfBirth,
        dateOfFirstAppointment,
        retirementAge: ageRuleYears,
        maximumServiceYears: serviceRuleYears,
        noticeMonths: notice,
        retirementByAge: retirementByAge.dateStr,
        retirementByService: retirementByService.dateStr,
        finalRetirementDate: finalRetirementObj.dateStr,
        producingRule,
        alertDate: alertObj.dateStr,
        remainingTime: remaining,
        currentStatus: status
      }
    });

  } catch (err) {
    console.error('[RETIREMENT CALCULATOR EXCEPTION]', err);
    return res.status(500).json({ success: false, message: 'Retirement calculation failed.' });
  }
}
