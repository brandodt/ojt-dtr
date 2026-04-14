import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { LogOut, Edit2, X, Check, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../lib/useDarkMode'
import Clock from './Clock'
import TimeInOut from './TimeInOut'
import DTRTable from './DTRTable'
import Calendar from './Calendar'
import Leaderboard from './Leaderboard'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [isDark, toggleDark] = useDarkMode()
  const [refresh, setRefresh] = useState(0)

  const currentYear = new Date().getFullYear()
  const defaultAY = `${currentYear} - ${currentYear + 1}`

  // Print DTR settings — persisted in localStorage
  const [supervisor, setSupervisor] = useState(
    () => localStorage.getItem('dtr_supervisor') || 'Mr. Mark Anthony Q. Pesigan'
  )
  const [academicYear, setAcademicYear] = useState(
    () => localStorage.getItem('dtr_ay') || defaultAY
  )
  const [semester, setSemester] = useState(
    () => localStorage.getItem('dtr_semester') || '2nd'
  )
  const [editing, setEditing] = useState(false)
  const dashRef = useRef()
  const signOutBtnRef = useRef()
  // draft state while editing
  const [draftSupervisor, setDraftSupervisor] = useState(supervisor)
  const [draftAY, setDraftAY] = useState(academicYear)
  const [draftSemester, setDraftSemester] = useState(semester)

  const darkToggleRef = useRef()

  function handleToggleDark() {
    if (darkToggleRef.current) {
      gsap.fromTo(darkToggleRef.current,
        { rotate: 0, scale: 1 },
        {
          rotate: 360, scale: 1.25, duration: 0.45, ease: 'back.out(1.5)',
          onComplete: () => gsap.set(darkToggleRef.current, { rotate: 0, scale: 1 })
        }
      )
    }
    toggleDark()
  }

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl
      .from('.dash-header', { y: -65, duration: 0.65 })
      .from('.dash-card', { opacity: 0, y: 42, stagger: 0.13, duration: 0.6, ease: 'back.out(1.3)' }, '-=0.25')
  }, { scope: dashRef })

  function openEdit() {
    setDraftSupervisor(supervisor)
    setDraftAY(academicYear)
    setDraftSemester(semester)
    setEditing(true)
  }

  function saveEdit() {
    setSupervisor(draftSupervisor)
    setAcademicYear(draftAY)
    setSemester(draftSemester)
    localStorage.setItem('dtr_supervisor', draftSupervisor)
    localStorage.setItem('dtr_ay', draftAY)
    localStorage.setItem('dtr_semester', draftSemester)
    setEditing(false)
  }

  return (
    <div ref={dashRef} className="min-h-screen text-[var(--dash-text)] transition-colors duration-300">
      {/* Top Nav */}
      <header className="dash-header sticky top-0 z-20 border-b border-emerald-900/50 bg-emerald-700 text-white shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-2 px-3 py-2">
          {/* Left: logos + title */}
          <div className="flex items-center gap-2 min-w-0">
            <img src="/cvsu-logo.png" alt="CvSU" className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm leading-tight truncate">CAVITE STATE UNIVERSITY</p>
              <p className="text-emerald-100/90 text-[10px] sm:text-xs truncate">Imus Campus — OJT DTR System</p>
            </div>
          </div>
          {/* Right: dark mode + sign out */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleDark}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30"
            >
              <span ref={darkToggleRef} className="flex items-center justify-center">
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </span>
            </button>
            <button
              ref={signOutBtnRef}
              onClick={() => {
                gsap.to(signOutBtnRef.current, { scale: 0.92, duration: 0.08, yoyo: true, repeat: 1 })
                setTimeout(signOut, 180)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-red-300/30 bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 active:bg-red-700"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-58px)] max-w-[1700px] grid-cols-1 gap-4 px-3 py-4 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_320px]">
        {/* LEFT SIDEBAR: Calendar */}
        <div className="hidden lg:block">
          <div className="dash-card">
            <Calendar />
          </div>
        </div>

        {/* MAIN CONTENT: Center (Properly Centered) */}
        <main className="min-w-0">
          <div className="w-full space-y-4">
            {/* Student Info Card */}
            <div className="dash-card dash-panel grid grid-cols-1 gap-3 p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs text-[var(--dash-muted)]">Name</p>
                <p className="font-bold text-[var(--dash-accent)]">{profile?.full_name || user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-muted)]">Student ID</p>
                <p className="font-semibold text-[var(--dash-accent)]">{profile?.student_id || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-muted)]">Program / Course</p>
                <p className="font-semibold text-[var(--dash-accent)]">{profile?.program} — {profile?.course_code}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-muted)]">Academic Year</p>
                <p className="font-semibold text-[var(--dash-accent)]">A.Y. {academicYear} · {semester} Sem</p>
              </div>
            </div>

            {/* Print DTR Settings Card */}
            <div className="dash-card dash-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="dash-section-title text-sm">Print DTR Settings</h3>
                {!editing ? (
                  <button
                    onClick={openEdit}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--dash-border)] px-2.5 py-1 text-xs font-semibold text-[var(--dash-accent)] transition-colors hover:bg-emerald-500/10"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveEdit}
                      className="dash-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs"
                    >
                      <Check size={12} /> Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1 rounded-lg border border-[var(--dash-border)] px-2.5 py-1 text-xs text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-surface-2)]"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              {!editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[var(--dash-muted)]">Supervisor / Head of Agency</p>
                    <p className="font-semibold text-[var(--dash-accent)]">{supervisor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--dash-muted)]">Academic Year</p>
                    <p className="font-semibold text-[var(--dash-accent)]">{academicYear}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--dash-muted)]">Semester</p>
                    <p className="font-semibold text-[var(--dash-accent)]">{semester} Semester</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--dash-muted)]">Supervisor / Head of Agency</label>
                    <input
                      type="text"
                      value={draftSupervisor}
                      onChange={e => setDraftSupervisor(e.target.value)}
                      className="dash-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--dash-muted)]">Academic Year (e.g. 2025 - 2026)</label>
                    <input
                      type="text"
                      value={draftAY}
                      onChange={e => setDraftAY(e.target.value)}
                      className="dash-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--dash-muted)]">Semester</label>
                    <select
                      value={draftSemester}
                      onChange={e => setDraftSemester(e.target.value)}
                      className="dash-input w-full text-sm"
                    >
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Clock */}
            <div className="dash-card"><Clock /></div>

            {/* Time In / Out */}
            <div className="dash-card"><TimeInOut onRecordSaved={() => setRefresh(r => r + 1)} /></div>

            {/* DTR Table */}
            <div className="dash-card"><DTRTable refresh={refresh} supervisor={supervisor} academicYear={academicYear} semester={semester} /></div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: Leaderboard */}
        <div className="hidden xl:block">
          <div className="dash-card">
            <Leaderboard refresh={refresh} />
          </div>
        </div>
      </div>
    </div>
  )
}
