// Shared calculation utilities for DTR progress and completion estimates

export function calculateProgress(totalHours, requiredHours = 486) {
  const remaining = Math.max(0, requiredHours - totalHours)
  const percent = Math.min(100, Math.round((totalHours / requiredHours) * 100))
  return { totalHours, remaining, percent: percent || 0 }
}

export function toISODateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getPhilippineHolidaySet(year) {
  const fixed = [
    `${year}-01-01`, // New Year's Day
    `${year}-04-09`, // Araw ng Kagitingan
    `${year}-05-01`, // Labor Day
    `${year}-06-12`, // Independence Day
    `${year}-11-01`, // All Saints' Day
    `${year}-11-02`, // All Souls' Day
    `${year}-11-30`, // Bonifacio Day
    `${year}-12-08`, // Feast of the Immaculate Conception
    `${year}-12-24`, // Christmas Eve
    `${year}-12-25`, // Christmas Day
    `${year}-12-30`, // Rizal Day
    `${year}-12-31`, // New Year's Eve
  ]

  // 2026 moving/special holidays
  const specialByYear = {
    2026: [
      '2026-01-23', // First Philippine Republic Day
      '2026-02-02', // Constitution Day
      '2026-02-17', // Chinese New Year
      '2026-02-25', // EDSA Revolution Anniversary
      '2026-03-03', // Lantern Festival
      '2026-03-20', // Eid al-Fitr
      '2026-04-02', // Maundy Thursday
      '2026-04-03', // Good Friday
      '2026-04-04', // Black Saturday
      '2026-04-05', // Easter Sunday
      '2026-04-27', // Lapu-Lapu Day
      '2026-05-27', // Eid al-Adha
      '2026-06-16', // Islamic New Year
      '2026-06-19', // Jose Rizal's Birthday
      '2026-07-27', // Iglesia ni Cristo Day
      '2026-08-21', // Ninoy Aquino Day
      '2026-08-25', // Birthday of Muhammad (Mawlid)
      '2026-08-31', // National Heroes' Day
      '2026-09-25', // Mid-Autumn Festival
    ],
  }

  return new Set([...(specialByYear[year] || []), ...fixed])
}

export function isWorkingDayInPH(date) {
  const day = date.getDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false
  const holidays = getPhilippineHolidaySet(date.getFullYear())
  return !holidays.has(toISODateLocal(date))
}

export function calcEstimatedCompletion(totalHours, workedDays, requiredHours = 486) {
  const { remaining } = calculateProgress(totalHours, requiredHours)
  if (remaining <= 0) return 'Completed!'

  const avgPerDay = workedDays > 0 ? totalHours / workedDays : 0
  if (avgPerDay <= 0) return '—'

  let daysNeeded = Math.ceil(remaining / avgPerDay)
  const d = new Date()
  while (daysNeeded > 0) {
    d.setDate(d.getDate() + 1)
    if (isWorkingDayInPH(d)) daysNeeded--
  }
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
