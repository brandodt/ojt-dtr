import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Printer } from 'react-feather'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
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

export default function DTRTable({ refresh, supervisor, academicYear, semester }) {
  const { user, profile } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const progressBarRef = useRef()
  const tbodyRef = useRef()
  const printBtnRef = useRef()
  const hasAnimatedBar = useRef(false)

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

  // Animate progress bar fill
  useEffect(() => {
    if (!progressBarRef.current) return
    if (!hasAnimatedBar.current) {
      hasAnimatedBar.current = true
      gsap.fromTo(progressBarRef.current,
        { width: '0%' },
        { width: `${percent}%`, duration: 1.5, ease: 'power2.out', delay: 0.4 }
      )
    } else {
      gsap.to(progressBarRef.current, { width: `${percent}%`, duration: 0.9, ease: 'power2.out' })
    }
  }, [percent])

  // Stagger table rows when data loads
  useEffect(() => {
    if (!loading && tbodyRef.current) {
      const rows = tbodyRef.current.querySelectorAll('tr')
      gsap.from(rows, { opacity: 0, y: 7, stagger: 0.02, duration: 0.32, ease: 'power2.out', delay: 0.1 })
    }
  }, [loading])

  // Split into two columns of 24 for the DTR layout
  const left = records.slice(0, 24)
  const right = records.slice(24, 48)
  const rows = Array.from({ length: 24 }, (_, i) => ({ l: left[i], r: right[i] }))

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-green-800">
          <SplitText
            text="Daily Time Record"
            tag="span"
            className="text-lg font-bold text-green-800"
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
            printDTR({ profile, user, records, supervisor, academicYear, semester })
          }}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Printer size={15} /> Print DTR
        </button>
      </div>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-green-700 mb-1">
          <span className="flex items-center gap-1">
            <Counter
              value={Math.round(totalHours)}
              fontSize={13}
              gap={1}
              horizontalPadding={0}
              borderRadius={0}
              textColor="#15803d"
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
              textColor="#15803d"
              fontWeight="600"
            />
            {' '}hrs remaining of {required}
          </span>
        </div>
        <div className="w-full bg-green-100 rounded-full h-3">
          <div
            ref={progressBarRef}
            className="bg-green-600 h-3 rounded-full"
            style={{ width: 0 }}
          />
        </div>
        <p className="text-xs text-green-700 mt-1 text-right flex items-center justify-end gap-1">
          <Counter
            value={percent}
            fontSize={13}
            gap={1}
            horizontalPadding={0}
            borderRadius={0}
            textColor="#15803d"
            fontWeight="600"
          />
          % completed
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading records…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="border border-green-900 px-2 py-1">Date</th>
                <th className="border border-green-900 px-2 py-1">Time In</th>
                <th className="border border-green-900 px-2 py-1">Time Out</th>
                <th className="border border-green-900 px-2 py-1">Hrs</th>
                <th className="border border-green-900 px-2 py-1">M</th>
                <th className="border border-green-900 px-2 py-1">Date</th>
                <th className="border border-green-900 px-2 py-1">Time In</th>
                <th className="border border-green-900 px-2 py-1">Time Out</th>
                <th className="border border-green-900 px-2 py-1">Hrs</th>
                <th className="border border-green-900 px-2 py-1">M</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                  {/* LEFT column */}
                  <td className="border border-gray-300 px-2 py-1 text-center">{row.l ? formatDate(row.l.date) : ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {row.l?.record_type === 'absent' ? <span className="text-red-500 font-bold text-xs">ABSENT</span> : (row.l ? formatTime(row.l.time_in) : '')}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {row.l?.record_type === 'absent' ? '' : (row.l ? formatTime(row.l.time_out) : '')}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {row.l?.record_type === 'absent' ? <span className="text-red-400 text-xs">0</span> : (row.l?.hours_rendered ? row.l.hours_rendered : '')}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {row.l?.record_type === 'absent' ? <span className="text-red-500 font-bold">A</span> : (row.l?.is_manual ? <span className="text-yellow-600 font-bold">M</span> : '')}
                  </td>
                  {/* RIGHT column */}
                  <td className="border border-gray-300 px-2 py-1 text-center">{row.r ? formatDate(row.r.date) : ''}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {row.r?.record_type === 'absent' ? <span className="text-red-500 font-bold text-xs">ABSENT</span> : (row.r ? formatTime(row.r.time_in) : '')}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {row.r?.record_type === 'absent' ? '' : (row.r ? formatTime(row.r.time_out) : '')}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {row.r?.record_type === 'absent' ? <span className="text-red-400 text-xs">0</span> : (row.r?.hours_rendered ? row.r.hours_rendered : '')}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {row.r?.record_type === 'absent' ? <span className="text-red-500 font-bold">A</span> : (row.r?.is_manual ? <span className="text-yellow-600 font-bold">M</span> : '')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-green-100 font-bold">
                <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right text-green-800">Total Hours (first 24):</td>
                <td className="border border-gray-300 px-2 py-1 text-center text-green-800">
                  {left.reduce((s, r) => s + (r.hours_rendered || 0), 0).toFixed(0)}
                </td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right text-green-800">Total Hours (next 24):</td>
                <td className="border border-gray-300 px-2 py-1 text-center text-green-800">
                  {right.reduce((s, r) => s + (r.hours_rendered || 0), 0).toFixed(0)}
                </td>
                <td className="border border-gray-300 px-2 py-1"></td>
              </tr>
            </tfoot>
          </table>
          {records.length > 48 && (
            <p className="text-xs text-gray-400 mt-2 text-center">Showing first 48 records. All records count toward totals.</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            <span className="text-yellow-600 font-bold">M</span> = manually encoded &nbsp;
            <span className="text-red-500 font-bold">A</span> = absent (not counted)
          </p>
        </div>
      )}
    </div>
  )
}
