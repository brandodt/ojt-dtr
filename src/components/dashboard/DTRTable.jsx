import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Printer, Edit2, Trash2, Check, X, Hand, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { printDTR } from './PrintDTR'
import Counter from '../Counter'
import SplitText from '../SplitText'
import { calculateProgress, calcEstimatedCompletion } from '../../lib/calculations'

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
  const { remaining, percent } = calculateProgress(totalHours, required)

  // Estimated completion date (skips weekends and PH holidays)
  const workedDays = records.filter(r => r.record_type !== 'absent' && r.hours_rendered > 0).length
  const estFinishLabel = calcEstimatedCompletion(totalHours, workedDays, required)
  const avgPerDay = workedDays > 0 ? totalHours / workedDays : 0

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
  }, [loading, percent])

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
    <div className="dash-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-[var(--dash-accent)]">
          <SplitText
            text="Daily Time Record"
            tag="span"
            className="text-lg font-bold text-[var(--dash-accent)]"
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
          className="dash-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Printer size={15} /> Print DTR
        </button>
      </div>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-[var(--dash-accent)]">
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
        <div className="h-3 w-full rounded-full bg-emerald-100 dark:bg-slate-700">
          <div
            ref={progressBarRef}
            className="h-3 rounded-full bg-emerald-500"

          />
        </div>
        <p className="mt-1 flex items-center justify-end gap-1 text-right text-xs text-[var(--dash-accent)]">
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
        <p className="mt-1 text-xs text-[var(--dash-accent)]">
          Est. completion: <span className="font-semibold">{estFinishLabel}</span>
          {avgPerDay > 0 && remaining > 0 && (
            <span className="ml-1 text-[var(--dash-muted)]">(avg {avgPerDay.toFixed(1)} hrs/day)</span>
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
              <tr className="bg-emerald-700 text-white">
                <th className="border border-emerald-900/70 px-2 py-1">#</th>
                <th className="border border-emerald-900/70 px-2 py-1">Date</th>
                <th className="border border-emerald-900/70 px-2 py-1">Time In</th>
                <th className="border border-emerald-900/70 px-2 py-1">Time Out</th>
                <th className="border border-emerald-900/70 px-2 py-1">Hrs</th>
                <th className="border border-emerald-900/70 px-2 py-1">M</th>
                <th className="border border-emerald-900/70 px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {records.map((r, i) => (
                <tr key={r.id ?? i} className={i % 2 === 0 ? 'bg-white/70 dark:bg-slate-800/80' : 'bg-emerald-50/70 dark:bg-slate-700/60'}>
                  <td className="border border-[var(--dash-border)] px-2 py-1 text-center text-[var(--dash-muted)]">{i + 1}</td>
                  <td className="border border-[var(--dash-border)] px-2 py-1 text-center">{formatDate(r.date)}</td>
                  {editId === r.id ? (
                    <>
                      <td ref={editRowAnimRef} className="border border-[var(--dash-border)] px-1 py-1">
                        <input
                          type="time"
                          value={editDraft.time_in}
                          onChange={e => setEditDraft(d => ({ ...d, time_in: e.target.value }))}
                          className="dash-input w-full px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border border-[var(--dash-border)] px-1 py-1">
                        <input
                          type="time"
                          value={editDraft.time_out}
                          onChange={e => setEditDraft(d => ({ ...d, time_out: e.target.value }))}
                          className="dash-input w-full px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border border-[var(--dash-border)] px-2 py-1 text-center text-xs text-[var(--dash-muted)]">
                        {calcHours(editDraft.time_in, editDraft.time_out) ?? '—'}
                      </td>
                      <td className="border border-[var(--dash-border)] px-2 py-1 text-center">
                        <Hand size={12} className="text-yellow-600 mx-auto" title="Manually encoded" />
                      </td>
                      <td className="border border-[var(--dash-border)] px-2 py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => saveEdit(r)} className="text-green-700 hover:text-green-900" title="Save"><Check size={13} /></button>
                          <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600" title="Cancel"><X size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {r.record_type === 'absent' ? (
                        <td colSpan={2} className="border border-[var(--dash-border)] px-2 py-1 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <AlertCircle size={13} className="text-red-500" />
                            <span className="text-red-500 font-semibold text-xs">ABSENT</span>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="border border-[var(--dash-border)] px-2 py-1 text-center">{formatTime(r.time_in)}</td>
                          <td className="border border-[var(--dash-border)] px-2 py-1 text-center">{formatTime(r.time_out)}</td>
                        </>
                      )}
                      <td className="border border-[var(--dash-border)] px-2 py-1 text-center">
                        {r.record_type === 'absent'
                          ? <span className="text-red-400">0</span>
                          : (r.hours_rendered ?? '')}
                      </td>
                      <td className="border border-[var(--dash-border)] px-2 py-1 text-center">
                        {r.record_type === 'absent'
                          ? <AlertCircle size={12} className="text-red-500 mx-auto" title="Absent" />
                          : (r.is_manual ? <Hand size={12} className="text-yellow-600 mx-auto" title="Manually encoded" /> : '')}
                      </td>
                      <td className="border border-[var(--dash-border)] px-2 py-1 text-center">
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
              <tr className="bg-emerald-100/80 dark:bg-slate-700 font-bold">
                <td colSpan={4} className="border border-[var(--dash-border)] px-2 py-1 text-right text-[var(--dash-accent)]">Total Hours:</td>
                <td className="border border-[var(--dash-border)] px-2 py-1 text-center text-[var(--dash-accent)]">{totalHours.toFixed(0)}</td>
                <td colSpan={2} className="border border-[var(--dash-border)] px-2 py-1"></td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--dash-border)] pt-3 text-xs text-[var(--dash-muted)]">
            <div className="flex items-center gap-1.5">
              <Hand size={14} className="text-yellow-600" />
              <span className="text-yellow-600 font-semibold">M</span>
              <span>= manually encoded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} className="text-red-500" />
              <span className="text-red-500 font-semibold">A</span>
              <span>= absent (not counted)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Edit2 size={14} className="text-blue-500" />
              <span className="text-blue-500 font-semibold">E</span>
              <span>= edit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trash2 size={14} className="text-red-400" />
              <span className="text-red-400 font-semibold">D</span>
              <span>= delete</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
