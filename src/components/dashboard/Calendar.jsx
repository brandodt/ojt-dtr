import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Helper functions
function toISODateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getSpecialNonWorkingHolidaySet(year) {
  // Based on official gazette: https://www.officialgazette.gov.ph/nationwide-holidays/
  const holidaysByYear = {
    2025: [
      '2025-01-01', // New Year's Day
      '2025-01-30', // Ninoy Aquino Day (moved from August 21)
      '2025-02-10', // Chinese New Year
      '2025-02-25', // EDSA Revolution Anniversary
      '2025-04-03', // Maundy Thursday
      '2025-04-04', // Good Friday
      '2025-04-05', // Black Saturday
      '2025-04-09', // Araw ng Kagitingan
      '2025-05-01', // Labor Day
      '2025-06-12', // Independence Day
      '2025-08-21', // Ninoy Aquino Day
      '2025-08-25', // Feast of the Muslim Ummah
      '2025-11-01', // All Saints' Day
      '2025-11-30', // Bonifacio Day
      '2025-12-08', // Feast of the Immaculate Conception
      '2025-12-25', // Christmas Day
      '2025-12-30', // Rizal Day
    ],
    2026: [
      '2026-01-01', // New Year's Day
      '2026-02-16', // Chinese New Year
      '2026-02-25', // EDSA Revolution Anniversary
      '2026-02-28', // Special Non-Working Day (if declared)
      '2026-04-02', // Maundy Thursday
      '2026-04-03', // Good Friday
      '2026-04-04', // Black Saturday
      '2026-04-09', // Araw ng Kagitingan
      '2026-05-01', // Labor Day
      '2026-06-12', // Independence Day
      '2026-08-21', // Ninoy Aquino Day
      '2026-08-25', // Feast of the Muslim Ummah
      '2026-11-01', // All Saints' Day
      '2026-11-30', // Bonifacio Day
      '2026-12-08', // Feast of the Immaculate Conception
      '2026-12-25', // Christmas Day
      '2026-12-30', // Rizal Day
    ],
  }

  return new Set(holidaysByYear[year] || [])
}

function isHoliday(date) {
  const holidays = getSpecialNonWorkingHolidaySet(date.getFullYear())
  return holidays.has(toISODateLocal(date))
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

export default function Calendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceDates, setAttendanceDates] = useState(new Set())
  const [absentDates, setAbsentDates] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Fetch attendance records for the current month
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true)
      const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

      const { data } = await supabase
        .from('time_records')
        .select('date, record_type')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)

      const attended = new Set()
      const absent = new Set()
      if (data) {
        data.forEach(record => {
          if (record.record_type === 'absent') {
            absent.add(record.date)
          } else {
            attended.add(record.date)
          }
        })
      }
      setAttendanceDates(attended)
      setAbsentDates(absent)
      setLoading(false)
    }

    if (user) fetchAttendance()
  }, [year, month, user, daysInMonth])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Generate calendar grid
  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthName = currentDate.toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get status for a day
  const getDayStatus = (day) => {
    if (!day) return null
    const date = new Date(year, month, day)
    const dateStr = toISODateLocal(date)

    if (absentDates.has(dateStr)) return 'absent'
    if (isHoliday(date)) return 'holiday'
    if (isWeekend(date)) return 'weekend'
    if (attendanceDates.has(dateStr)) return 'attended'
    return 'no-record'
  }

  // Get color classes for day
  const getDayClasses = (status) => {
    switch (status) {
      case 'attended':
        return 'bg-emerald-100/90 dark:bg-emerald-900/45 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold'
      case 'absent':
        return 'bg-rose-100/90 dark:bg-rose-900/40 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-semibold'
      case 'holiday':
        return 'bg-amber-100/90 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold'
      case 'weekend':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-300 dark:border-slate-600'
      case 'no-record':
        return 'bg-white/70 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-600'
      default:
        return 'bg-white/70 dark:bg-slate-800 text-slate-300 border-slate-300 dark:border-slate-600'
    }
  }

  return (
    <div className="dash-panel p-5">
      {/* Header */}
      <div className="mb-6">
        <h3 className="dash-section-title text-lg">Attendance Calendar</h3>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="shrink-0 rounded-lg border border-[var(--dash-border)] p-1.5 text-[var(--dash-accent)] transition-colors hover:bg-emerald-500/10"
            title="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="max-w-[9.5rem] flex-1 truncate text-center text-sm font-semibold text-[var(--dash-text)]">{monthName}</span>
          <button
            onClick={handleNextMonth}
            className="shrink-0 rounded-lg border border-[var(--dash-border)] p-1.5 text-[var(--dash-accent)] transition-colors hover:bg-emerald-500/10"
            title="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-6 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--dash-border)] bg-white/60 px-2 py-1.5 dark:bg-slate-700/40">
          <div className="h-3 w-3 rounded border border-emerald-400 bg-emerald-200 dark:bg-emerald-900/60"></div>
          <span className="text-[var(--dash-muted)]">Attended</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--dash-border)] bg-white/60 px-2 py-1.5 dark:bg-slate-700/40">
          <div className="h-3 w-3 rounded border border-rose-400 bg-rose-200 dark:bg-rose-900/60"></div>
          <span className="text-[var(--dash-muted)]">Absent</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--dash-border)] bg-white/60 px-2 py-1.5 dark:bg-slate-700/40">
          <div className="h-3 w-3 rounded border border-amber-400 bg-amber-200 dark:bg-amber-900/60"></div>
          <span className="text-[var(--dash-muted)]">Holiday</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--dash-border)] bg-white/60 px-2 py-1.5 dark:bg-slate-700/40">
          <div className="h-3 w-3 rounded border border-slate-300 bg-slate-200 dark:bg-slate-700"></div>
          <span className="text-[var(--dash-muted)]">Weekend</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--dash-border)] bg-white/60 px-2 py-1.5 dark:bg-slate-700/40">
          <div className="h-3 w-3 rounded border border-slate-300 bg-white/70 dark:bg-slate-800"></div>
          <span className="text-[var(--dash-muted)]">No Record</span>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400 animate-pulse">Loading attendance...</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-64 grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-bold text-[var(--dash-muted)]"
              >
                {day}
              </div>
            ))}

            {/* Days */}
            {days.map((day, index) => {
              const status = getDayStatus(day)

              return (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center rounded-lg border text-sm transition-colors ${day ? getDayClasses(status) : 'border-transparent'
                    }`}
                >
                  {day && <div className="font-semibold text-sm">{day}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--dash-border)] pt-6 text-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{attendanceDates.size}</p>
          <p className="text-xs text-[var(--dash-muted)]">Days Attended</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{getSpecialNonWorkingHolidaySet(year).size}</p>
          <p className="text-xs text-[var(--dash-muted)]">Holidays in {year}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--dash-muted)]">
            {daysInMonth - attendanceDates.size - Array.from(getSpecialNonWorkingHolidaySet(year)).filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length}
          </p>
          <p className="text-xs text-[var(--dash-muted)]">Days Without Record</p>
        </div>
      </div>
    </div>
  )
}
