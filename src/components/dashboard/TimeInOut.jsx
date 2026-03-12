import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { LogIn, LogOut, X, Plus, UserX } from 'react-feather'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

function toTimeString(date) {
  return date.toTimeString().slice(0, 5)
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function calcHours(timeIn, timeOut, schedule) {
  if (schedule === 'temp_8hr') return 8
  if (!timeIn || !timeOut) return null
  const [inH, inM] = timeIn.split(':').map(Number)
  const [outH, outM] = timeOut.split(':').map(Number)
  const raw = (outH * 60 + outM - (inH * 60 + inM)) / 60
  if (raw <= 0) return null   // time-out is not after time-in
  const net = parseFloat((raw - 1).toFixed(2))
  return net > 0 ? net : null  // net zero after lunch deduction ? invalid
}

const blankRow = () => ({ date: '', timeIn: '', timeOut: '', type: 'regular', schedule: 'standard' })

export default function TimeInOut({ onRecordSaved }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [mode, setMode] = useState('today')
  const [loading, setLoading] = useState(false)
  const [confirmAbsent, setConfirmAbsent] = useState(false)

  // Today tab schedule
  const [todaySchedule, setTodaySchedule] = useState('standard')

  const modeContentRef = useRef()
  const timeInBtnRef = useRef()
  const timeOutBtnRef = useRef()
  const absentBtnRef = useRef()
  const confirmPanelRef = useRef()
  const isMountedRef = useRef(false)

  // Slide tab content on mode CHANGE (skip on initial mount)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    if (!modeContentRef.current) return
    const dir = mode === 'today' ? -1 : 1
    gsap.fromTo(
      modeContentRef.current,
      { opacity: 0, x: dir * 28 },
      { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
    )
  }, [mode])

  // Animate confirmation panel when it appears
  useEffect(() => {
    if (confirmAbsent && confirmPanelRef.current) {
      gsap.fromTo(
        confirmPanelRef.current,
        { opacity: 0, y: -10, scaleY: 0.85 },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.28, ease: 'back.out(1.6)', transformOrigin: 'top' }
      )
    }
  }, [confirmAbsent])

  // Past-date rows
  const [rows, setRows] = useState([blankRow()])

  // Callback ref � animates feedback message on mount
  const msgAnimRef = (el) => {
    if (!el) return
    gsap.from(el, { opacity: 0, y: -14, scale: 0.96, duration: 0.32, ease: 'back.out(2)' })
  }

  const showMsg = (type, text) => showToast(type, text)

  const updateRow = (i, field, value) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const addRow = () => setRows(prev => [...prev, blankRow()])

  const removeRow = (i) => setRows(prev =>
    prev.length === 1 ? [blankRow()] : prev.filter((_, idx) => idx !== i)
  )

  /* -- TODAY: Time In -- */
  const handleTimeIn = async () => {
    setLoading(true)
    const today = todayStr()
    const timeIn = toTimeString(new Date())

    const { data: existing } = await supabase
      .from('time_records')
      .select('id, time_in, time_out')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (existing) {
      if (existing.time_in) {
        showMsg('error', 'You already timed in today.')
      } else {
        await supabase.from('time_records').update({ time_in: timeIn }).eq('id', existing.id)
        showMsg('success', `Time In recorded: ${timeIn}`)
        onRecordSaved()
      }
    } else {
      const { error } = await supabase.from('time_records').insert({
        user_id: user.id,
        date: today,
        time_in: timeIn,
        is_manual: false,
        record_type: 'regular',
      })
      if (error) showMsg('error', error.message)
      else { showMsg('success', `Time In recorded: ${timeIn}`); onRecordSaved() }
    }
    setLoading(false)
  }

  /* -- TODAY: Time Out -- */
  const handleTimeOut = async () => {
    setLoading(true)
    const today = todayStr()
    const timeOut = toTimeString(new Date())

    const { data: existing } = await supabase
      .from('time_records')
      .select('id, time_in, time_out')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (!existing || !existing.time_in) {
      showMsg('error', 'Please Time In first before Timing Out.')
      setLoading(false)
      return
    }
    if (existing.time_out) {
      showMsg('error', 'You already timed out today.')
      setLoading(false)
      return
    }

    const hours = calcHours(existing.time_in, timeOut, todaySchedule)
    if (todaySchedule !== 'temp_8hr' && (hours === null || hours <= 0)) {
      showMsg('error', 'Time Out must be later than Time In (and result in at least 1 hour after lunch deduction).')
      setLoading(false)
      return
    }
    const label = todaySchedule === 'temp_8hr'
      ? '8 hrs (temp schedule)'
      : `${hours} hrs after lunch deduction`

    const { error } = await supabase.from('time_records')
      .update({ time_out: timeOut, hours_rendered: hours })
      .eq('id', existing.id)

    if (error) showMsg('error', error.message)
    else { showMsg('success', `Time Out recorded: ${timeOut}  ${label}`); onRecordSaved() }
    setLoading(false)
  }

  /* -- TODAY: Mark Absent -- */
  const handleMarkAbsent = async () => {
    setLoading(true)
    const today = todayStr()

    const { data: existing } = await supabase
      .from('time_records')
      .select('id, record_type')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (existing) {
      if (existing.record_type === 'absent') {
        showMsg('error', 'Already marked absent today.')
        setLoading(false)
        return
      }
      const { error } = await supabase
        .from('time_records')
        .update({ time_in: null, time_out: null, hours_rendered: 0, record_type: 'absent', is_manual: false })
        .eq('id', existing.id)
      if (error) showMsg('error', error.message)
      else { showMsg('success', 'Marked as absent for today.'); onRecordSaved() }
    } else {
      const { error } = await supabase
        .from('time_records')
        .insert({ user_id: user.id, date: today, time_in: null, time_out: null, hours_rendered: 0, record_type: 'absent', is_manual: false })
      if (error) showMsg('error', error.message)
      else { showMsg('success', 'Marked as absent for today.'); onRecordSaved() }
    }
    setLoading(false)
  }

  /* -- PAST DATE ENCODE (multiple rows) -- */
  const handlePastSave = async (e) => {
    e.preventDefault()
    const today = todayStr()

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (!r.date) { showMsg('error', `Row ${i + 1}: Date is required.`); return }
      if (r.date >= today) { showMsg('error', `Row ${i + 1}: Date must be before today.`); return }
      if (r.type === 'regular' && !r.timeIn) {
        showMsg('error', `Row ${i + 1}: Time In is required for regular duty.`)
        return
      }
      if (r.type === 'regular' && r.schedule !== 'temp_8hr' && r.timeIn && r.timeOut) {
        const h = calcHours(r.timeIn, r.timeOut, r.schedule)
        if (h === null || h <= 0) {
          showMsg('error', `Row ${i + 1}: Time Out (${r.timeOut}) must be after Time In (${r.timeIn}) and result in at least 1 hour after lunch deduction.`)
          return
        }
      }
    }

    setLoading(true)
    const upserts = rows.map(r => ({
      user_id: user.id,
      date: r.date,
      time_in: r.type === 'absent' ? null : r.timeIn,
      time_out: r.type === 'absent' ? null : (r.timeOut || null),
      hours_rendered: r.type === 'absent' ? 0 : calcHours(r.timeIn, r.timeOut, r.schedule),
      is_manual: true,
      record_type: r.type,
    }))

    const { error } = await supabase
      .from('time_records')
      .upsert(upserts, { onConflict: 'user_id,date' })

    if (error) showMsg('error', error.message)
    else {
      showMsg('success', `${rows.length} record${rows.length > 1 ? 's' : ''} saved successfully.`)
      setRows([blankRow()])
      onRecordSaved()
    }
    setLoading(false)
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setMode('today')}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${mode === 'today' ? 'bg-green-700 text-white active:bg-green-800' : 'bg-green-50 dark:bg-gray-700 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-gray-600 active:bg-green-200'}`}
        >
          Today&apos;s Attendance
        </button>
        <button
          onClick={() => setMode('past')}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${mode === 'past' ? 'bg-yellow-600 text-white active:bg-yellow-700' : 'bg-yellow-50 dark:bg-gray-700 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-gray-600 active:bg-yellow-200'}`}
        >
          Encode Past Date
        </button>
      </div>

      {/* Feedback */}

      {/* TODAY MODE */}
      {mode === 'today' && (
        <div ref={modeContentRef} className="space-y-3">
          <label className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={todaySchedule === 'temp_8hr'}
              onChange={e => setTodaySchedule(e.target.checked ? 'temp_8hr' : 'standard')}
              className="accent-green-700 w-4 h-4"
            />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Use Temp Schedule (8:30 AM &ndash; 5:00 PM = <strong>8 hrs</strong>)
            </span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              ref={timeInBtnRef}
              onClick={() => {
                gsap.to(timeInBtnRef.current, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.inOut' })
                handleTimeIn()
              }}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-6 rounded-xl text-lg transition-colors disabled:opacity-60 shadow flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> TIME IN
            </button>
            <button
              ref={timeOutBtnRef}
              onClick={() => {
                gsap.to(timeOutBtnRef.current, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.inOut' })
                handleTimeOut()
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-6 rounded-xl text-lg transition-colors disabled:opacity-60 shadow flex items-center justify-center gap-2"
            >
              <LogOut size={20} /> TIME OUT
            </button>
          </div>
          {!confirmAbsent ? (
            <button
              ref={absentBtnRef}
              onClick={() => {
                gsap.to(absentBtnRef.current, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.inOut' })
                setConfirmAbsent(true)
              }}
              disabled={loading}
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700 hover:border-red-400 text-red-600 dark:text-red-400 hover:text-red-700 font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <UserX size={16} /> Mark as Absent Today
            </button>
          ) : (
            <div ref={confirmPanelRef} className="w-full bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl px-4 py-3 flex flex-col gap-2">
              <p className="text-sm text-red-700 dark:text-red-300 font-semibold text-center">Are you sure you want to mark today as absent?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConfirmAbsent(false)
                    handleMarkAbsent()
                  }}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  <UserX size={14} /> Yes, Mark Absent
                </button>
                <button
                  onClick={() => setConfirmAbsent(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAST DATE MODE */}
      {mode === 'past' && (
        <div ref={modeContentRef}>
        <form onSubmit={handlePastSave} className="space-y-3">
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className={`border rounded-lg p-3 space-y-2 ${row.type === 'absent' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'}`}
              >
                {/* Date + Type + Remove */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                  <div>
                    <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={row.date}
                      max={yesterday}
                      onChange={e => updateRow(i, 'date', e.target.value)}
                      required
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-green-300 dark:border-gray-500 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">Type</label>
                    <select
                      value={row.type}
                      onChange={e => updateRow(i, 'type', e.target.value)}
                      className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-green-300 dark:border-gray-500 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="regular">Regular Duty</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-600 px-1 pb-1"
                    title="Remove row"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Time In/Out + Schedule (regular only) */}
                {row.type === 'regular' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
                    <div>
                      <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">Time In</label>
                      <input
                        type="time"
                        value={row.timeIn}
                        onChange={e => updateRow(i, 'timeIn', e.target.value)}
                        required
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-green-300 dark:border-gray-500 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">Time Out</label>
                      <input
                        type="time"
                        value={row.timeOut}
                        onChange={e => updateRow(i, 'timeOut', e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-green-300 dark:border-gray-500 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">Schedule</label>
                      <select
                        value={row.schedule}
                        onChange={e => updateRow(i, 'schedule', e.target.value)}
                        className="w-full border border-green-300 dark:border-gray-500 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="standard">Standard (auto)</option>
                        <option value="temp_8hr">Temp (8 hrs)</option>
                      </select>
                    </div>
                  </div>
                )}

                {row.type === 'absent' && (
                  <p className="text-xs text-red-600 font-medium italic">Marked as absent  0 hrs rendered</p>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full border-2 border-dashed border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 active:bg-yellow-100 text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={15} /> Add Another Date
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving...' : `Save ${rows.length} Record${rows.length > 1 ? 's' : ''}`}
          </button>
        </form>
        </div>
      )}
    </div>
  )
}
