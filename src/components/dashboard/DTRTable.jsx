import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Printer, Edit2, Trash2, Check, X } from 'react-feather'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { printDTR } from './PrintDTR'
import Counter from '../Counter'
import SplitText from '../SplitText'

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function calcHours(timeIn, timeOut) {
  if (!timeIn || !timeOut) return null
  const [inH, inM] = timeIn.split(':').map(Number)
  const [outH, outM] = timeOut.split(':').map(Number)
  const raw = (outH * 60 + outM - (inH * 60 + inM)) / 60
  if (raw <= 0) return null
  const net = parseFloat((raw - 1).toFixed(2))
  return net > 0 ? net : null
}

function toISODateLocal(date) {
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

  // 2026 moving/special holidays used by the app's estimate calculation.
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

function isWorkingDayInPH(date) {
  const day = date.getDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false
  const holidays = getPhilippineHolidaySet(date.getFullYear())
  return !holidays.has(toISODateLocal(date))
}

export default function DTRTable({ refresh, supervisor, academicYear, semester }) {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editDraft, setEditDraft] = useState({ time_in: '', time_out: '' })
  const [deletingId, setDeletingId] = useState(null)

  const progressBarRef = useRef()
  const tbodyRef = useRef()
  const printBtnRef = useRef()

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('time_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .then(({ data }) => {
        setRecords(data || [])
        setLoading(false)
      })
  }, [user, refresh])

  const totalHours = records.reduce((sum, r) => sum + (r.hours_rendered || 0), 0)
  const required = profile?.total_required_hours || 486
  const remaining = Math.max(0, required - totalHours)
  const percent = Math.min(100, Math.round((totalHours / required) * 100))

  // Estimated completion date (skips weekends and PH holidays)
  const workedDays = records.filter(r => r.record_type !== 'absent' && r.hours_rendered > 0).length
  const avgPerDay = workedDays > 0 ? totalHours / workedDays : 0
  const estFinishLabel = (() => {
    if (remaining <= 0) return 'Completed!'
    if (avgPerDay <= 0) return '—'
    let daysNeeded = Math.ceil(remaining / avgPerDay)
    const d = new Date()
    while (daysNeeded > 0) {
      d.setDate(d.getDate() + 1)
      if (isWorkingDayInPH(d)) daysNeeded--
    }
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  })()

  // Initialize bar to 0% so GSAP has full control of the width
  useEffect(() => {
    if (progressBarRef.current) gsap.set(progressBarRef.current, { width: '0%' })
  }, [])

  // Animate progress bar only after data has loaded
  useEffect(() => {
    if (!progressBarRef.current || loading) return
    gsap.fromTo(
      progressBarRef.current,
      { width: '0%' },
      { width: `${percent}%`, duration: 1.5, ease: 'power2.out' }
    )
  }, [loading])

  // Stagger table rows when data loads
  useEffect(() => {
    if (!loading && tbodyRef.current) {
      const rows = tbodyRef.current.querySelectorAll('tr')
      gsap.from(rows, { opacity: 0, y: 7, stagger: 0.02, duration: 0.32, ease: 'power2.out', delay: 0.1 })
    }
  }, [loading])

  function startEdit(r) {
    setEditId(r.id)
    setEditDraft({ time_in: r.time_in || '', time_out: r.time_out || '' })
  }

  // Callback ref to animate edit cells when they mount
  const editRowAnimRef = (el) => {
    if (!el) return
    gsap.fromTo(el,
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.22, ease: 'power2.out' }
    )
  }

  async function saveEdit(r) {
    const hours = calcHours(editDraft.time_in, editDraft.time_out)
    if (editDraft.time_in && editDraft.time_out && hours === null) {
      showToast('error', 'Time Out must be after Time In (min 1 hr after lunch deduction).')
      return
    }
    const { error } = await supabase
      .from('time_records')
      .update({
        time_in: editDraft.time_in || null,
        time_out: editDraft.time_out || null,
        hours_rendered: hours,
        is_manual: true,
      })
      .eq('id', r.id)
    if (error) { showToast('error', error.message); return }
    setRecords(prev => prev.map(rec => rec.id === r.id
      ? { ...rec, time_in: editDraft.time_in, time_out: editDraft.time_out, hours_rendered: hours, is_manual: true }
      : rec
    ))
    setEditId(null)
    showToast('success', `Record for ${formatDate(r.date)} updated.`)
  }

  async function deleteRecord(r) {
    setDeletingId(r.id)
    const { error } = await supabase.from('time_records').delete().eq('id', r.id)
    if (error) { showToast('error', error.message); setDeletingId(null); return }
    setRecords(prev => prev.filter(rec => rec.id !== r.id))
    setDeletingId(null)
    showToast('success', `Record for ${formatDate(r.date)} deleted.`)
  }



  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-green-800 dark:text-green-400">
          <SplitText
            text="Daily Time Record"
            tag="span"
            className="text-lg font-bold text-green-800 dark:text-green-400"
            delay={35}
            duration={0.6}
            ease="back.out(1.4)"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            textAlign="left"
            threshold={0.2}
            rootMargin="0px"
          />
        </h3>
        <button
          ref={printBtnRef}
          onClick={() => {
            gsap.to(printBtnRef.current, { scale: 0.93, duration: 0.08, yoyo: true, repeat: 1 })
            printDTR({ profile, user, records, supervisor, academicYear, semester }).catch(console.error)
          }}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Printer size={15} /> Print DTR
        </button>
      </div>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-green-700 dark:text-green-400 mb-1">
          <span className="flex items-center gap-1">
            <Counter
              value={Math.round(totalHours)}
              fontSize={13}
              gap={1}
              horizontalPadding={0}
              borderRadius={0}
              textColor="currentColor"
              fontWeight="600"
            />
            {' '}hrs rendered
          </span>
          <span className="flex items-center gap-1">
            <Counter
              value={Math.round(remaining)}
              fontSize={13}
              gap={1}
              horizontalPadding={0}
              borderRadius={0}
              textColor="currentColor"
              fontWeight="600"
            />
            {' '}hrs remaining of {required}
          </span>
        </div>
        <div className="w-full bg-green-100 dark:bg-gray-700 rounded-full h-3">
          <div
            ref={progressBarRef}
            className="bg-green-600 h-3 rounded-full"

          />
        </div>
        <p className="text-xs text-green-700 dark:text-green-400 mt-1 text-right flex items-center justify-end gap-1">
          <Counter
            value={percent}
            fontSize={13}
            gap={1}
            horizontalPadding={0}
            borderRadius={0}
            textColor="currentColor"
            fontWeight="600"
          />
          % completed
        </p>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Est. completion: <span className="font-semibold">{estFinishLabel}</span>
          {avgPerDay > 0 && remaining > 0 && (
            <span className="text-gray-400 ml-1">(avg {avgPerDay.toFixed(1)} hrs/day)</span>
          )}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading records…</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="border border-green-900 px-2 py-1">#</th>
                <th className="border border-green-900 px-2 py-1">Date</th>
                <th className="border border-green-900 px-2 py-1">Time In</th>
                <th className="border border-green-900 px-2 py-1">Time Out</th>
                <th className="border border-green-900 px-2 py-1">Hrs</th>
                <th className="border border-green-900 px-2 py-1">M</th>
                <th className="border border-green-900 px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {records.map((r, i) => (
                <tr key={r.id ?? i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-green-50 dark:bg-gray-700/60'}>
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center dark:text-gray-200">{formatDate(r.date)}</td>
                  {editId === r.id ? (
                    <>
                      <td ref={editRowAnimRef} className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                        <input
                          type="time"
                          value={editDraft.time_in}
                          onChange={e => setEditDraft(d => ({ ...d, time_in: e.target.value }))}
                          className="w-full border border-green-300 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 rounded px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-1 py-1">
                        <input
                          type="time"
                          value={editDraft.time_out}
                          onChange={e => setEditDraft(d => ({ ...d, time_out: e.target.value }))}
                          className="w-full border border-green-300 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 rounded px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-gray-400 dark:text-gray-400 text-xs">
                        {calcHours(editDraft.time_in, editDraft.time_out) ?? '—'}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                        <span className="text-yellow-600 font-bold">M</span>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => saveEdit(r)} className="text-green-700 hover:text-green-900" title="Save"><Check size={13} /></button>
                          <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600" title="Cancel"><X size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {r.record_type === 'absent' ? (
                        <td colSpan={2} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                          <span className="text-red-500 font-bold">ABSENT</span>
                        </td>
                      ) : (
                        <>
                          <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center dark:text-gray-200">{formatTime(r.time_in)}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center dark:text-gray-200">{formatTime(r.time_out)}</td>
                        </>
                      )}
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center dark:text-gray-200">
                        {r.record_type === 'absent'
                          ? <span className="text-red-400">0</span>
                          : (r.hours_rendered ?? '')}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                        {r.record_type === 'absent'
                          ? <span className="text-red-500 font-bold">A</span>
                          : (r.is_manual ? <span className="text-yellow-600 font-bold">M</span> : '')}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {r.record_type !== 'absent' && (
                            <button
                              onClick={() => startEdit(r)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteRecord(r)}
                            disabled={deletingId === r.id}
                            className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-green-100 dark:bg-gray-700 font-bold">
                <td colSpan={4} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-right text-green-800 dark:text-green-300">Total Hours:</td>
                <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-green-800 dark:text-green-300">{totalHours.toFixed(0)}</td>
                <td colSpan={2} className="border border-gray-300 dark:border-gray-600 px-2 py-1"></td>
              </tr>
            </tfoot>
          </table>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            <span className="text-yellow-600 font-bold">M</span> = manually encoded &nbsp;
            <span className="text-red-500 font-bold">A</span> = absent (not counted) &nbsp;
            <span className="text-blue-500 font-bold">✎</span> = edit &nbsp;
            <span className="text-red-400 font-bold">🗑</span> = delete
          </p>
        </div>
      )}
    </div>
  )
}
