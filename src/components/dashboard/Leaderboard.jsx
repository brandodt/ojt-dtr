import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Zap, Calendar, Award } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { calculateProgress, calcEstimatedCompletion } from '../../lib/calculations'

export default function Leaderboard({ refresh = 0 }) {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const containerRef = useRef()
  const rowsRef = useRef([])

  useEffect(() => {
    fetchLeaderboard()
  }, [refresh])

  async function fetchLeaderboard() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('leaderboard_data')
        .select('*')

      if (err) throw err

      const toCompletionSortValue = (estCompletion) => {
        if (estCompletion === 'Completed!') return Number.NEGATIVE_INFINITY
        if (estCompletion === '—') return Number.POSITIVE_INFINITY

        const dateValue = new Date(estCompletion).getTime()
        return Number.isNaN(dateValue) ? Number.POSITIVE_INFINITY : dateValue
      }

      // Rank by earliest estimated completion date (soonest finisher comes first)
      const enriched = data?.map((student) => ({
        ...student,
        progress: calculateProgress(student.total_hours_rendered, student.total_required_hours),
        estCompletion: calcEstimatedCompletion(
          student.total_hours_rendered,
          student.work_days,
          student.total_required_hours
        ),
      })) || []

      const sorted = enriched
        .sort((a, b) => {
          const aCompletion = toCompletionSortValue(a.estCompletion)
          const bCompletion = toCompletionSortValue(b.estCompletion)

          if (aCompletion !== bCompletion) {
            return aCompletion - bCompletion
          }

          if (a.progress.percent !== b.progress.percent) {
            return b.progress.percent - a.progress.percent
          }

          return b.total_hours_rendered - a.total_hours_rendered
        })
        .map((student, idx) => ({
          ...student,
          rank: idx + 1,
        }))

      setLeaders(sorted)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  useGSAP(() => {
    if (rowsRef.current.length > 0 && !loading) {
      gsap.from(rowsRef.current, {
        opacity: 0,
        x: -6,
        stagger: 0.04,
        duration: 0.35,
        ease: 'power2.out',
      })
    }
  }, { scope: containerRef, dependencies: [loading] })

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400 text-yellow-900'
      case 2:
        return 'bg-gray-300 text-gray-900'
      case 3:
        return 'bg-orange-300 text-orange-900'
      default:
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
    }
  }

  const getRankLabel = (rank) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  return (
    <div ref={containerRef} className="dash-panel flex flex-col p-4">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-[var(--dash-border)]">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={18} className="text-yellow-500" />
          <h3 className="dash-section-title text-sm font-bold">
            OJT HOUR COMPLETION
          </h3>
        </div>
        <p className="text-xs text-[var(--dash-muted)]">
          Top students closest to finishing their training hours
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-6">Loading…</p>
      ) : error ? (
        <p className="text-xs text-red-400 text-center py-6">{error}</p>
      ) : leaders.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No students yet.</p>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto">
          {leaders.slice(0, 8).map((student, i) => (
            <div
              key={student.id}
              ref={(el) => (rowsRef.current[i] = el)}
              className="rounded-lg border border-[var(--dash-border)] bg-gradient-to-r from-white/70 to-white/50 dark:from-slate-700/70 dark:to-slate-700/40 p-3 transition-all hover:shadow-md hover:from-emerald-500/15 hover:to-emerald-400/10 dark:hover:from-emerald-500/20 dark:hover:to-emerald-400/15"
            >
              {/* Rank Badge & Name */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold shrink-0 text-sm ${getRankBadgeColor(student.rank)}`}>
                  {getRankLabel(student.rank)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-green-900 dark:text-green-100 text-xs truncate">
                    {student.full_name.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Stats */}
              <div className="space-y-1">
                {/* Progress Meter */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                        style={{ width: `${Math.min(student.progress.percent, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--dash-accent)] whitespace-nowrap">
                    {student.progress.percent}%
                  </span>
                </div>

                {/* Hours & Estimated Completion */}
                <div className="flex items-center justify-between text-xs text-[var(--dash-muted)]">
                  <span>{student.total_hours_rendered || 0}h / {student.total_required_hours || 0}h</span>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span className={student.estCompletion === 'Completed!' ? 'text-green-600 dark:text-green-400 font-bold' : ''}>
                      {student.estCompletion}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {leaders.length > 8 && (
        <p className="mt-2 border-t border-[var(--dash-border)] pt-2 text-center text-xs text-[var(--dash-muted)]">
          +{leaders.length - 8} more students
        </p>
      )}
    </div>
  )
}
