import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { TrendingUp } from 'lucide-react'
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
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp size={16} className="text-[var(--dash-accent)]" />
        <h3 className="dash-section-title text-sm">
          Top Students
        </h3>
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
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--dash-border)] bg-white/65 p-2 text-xs transition-colors hover:bg-emerald-500/10 dark:bg-slate-700/55"
            >
              {/* Rank Badge */}
              <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold shrink-0 text-xs ${getRankBadgeColor(student.rank)}`}>
                {getRankLabel(student.rank)}
              </div>

              {/* Student Name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-900 dark:text-green-100 text-xs truncate">
                  {student.full_name}
                </p>
              </div>

              {/* Progress % */}
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-[var(--dash-accent)]">
                  {student.progress.percent}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {leaders.length > 8 && (
        <p className="mt-2 border-t border-[var(--dash-border)] pt-2 text-center text-xs text-[var(--dash-muted)]">
          +{leaders.length - 8} more
        </p>
      )}
    </div>
  )
}
