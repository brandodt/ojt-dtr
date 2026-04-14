import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, AlertCircle, Minus, X } from 'lucide-react'
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
        return 'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-300 border-green-300 dark:border-green-600 font-semibold'
      case 'absent':
        return 'bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-300 border-red-300 dark:border-red-600 font-semibold'
      case 'holiday':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600 font-semibold'
      case 'weekend':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
      case 'no-record':
        return 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500'
      default:
        return 'bg-white dark:bg-gray-800 text-gray-300'
    }
  }

  const getDayLabel = (day) => {
    if (!day) return null
    const date = new Date(year, month, day)
    const status = getDayStatus(day)

    if (status === 'absent') return 'absent'
    if (status === 'attended') return 'attended'
    if (status === 'holiday') return 'holiday'
    if (status === 'weekend') return 'weekend'
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-green-800 dark:text-green-400">Attendance Calendar</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-green-700 dark:text-green-400"
            title="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-40 text-center">{monthName}</span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-green-700 dark:text-green-400"
            title="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/60 border border-green-400 dark:border-green-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Attended</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/60 border border-red-400 dark:border-red-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-900/60 border border-yellow-400 dark:border-yellow-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Weekend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"></div>
          <span className="text-gray-700 dark:text-gray-300">No Record</span>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400 animate-pulse">Loading attendance...</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-64">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {/* Days */}
            {days.map((day, index) => {
              const status = getDayStatus(day)
              const label = getDayLabel(day)

              return (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center rounded-lg border text-sm transition-colors ${
                    day ? getDayClasses(status) : 'border-transparent'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    {day && (
                      <>
                        <div className="font-medium text-sm">{day}</div>
                        {label === 'attended' && <Check size={14} />}
                        {label === 'absent' && <X size={14} />}
                        {label === 'holiday' && <AlertCircle size={14} />}
                        {label === 'weekend' && <Minus size={14} />}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-3 text-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{attendanceDates.size}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Days Attended</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{getSpecialNonWorkingHolidaySet(year).size}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Holidays in {year}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {daysInMonth - attendanceDates.size - Array.from(getSpecialNonWorkingHolidaySet(year)).filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Days Without Record</p>
        </div>
      </div>
    </div>
  )
}
