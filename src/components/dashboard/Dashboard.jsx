import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { LogOut, Edit2, X, Check, Sun, Moon } from 'react-feather'
import { useAuth } from '../../context/AuthContext'
import { useDarkMode } from '../../lib/useDarkMode'
import Clock from './Clock'
import TimeInOut from './TimeInOut'
import DTRTable from './DTRTable'

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
        { rotate: 360, scale: 1.25, duration: 0.45, ease: 'back.out(1.5)',
          onComplete: () => gsap.set(darkToggleRef.current, { rotate: 0, scale: 1 }) }
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
    <div ref={dashRef} className="min-h-screen bg-green-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Top Nav */}
      <header className="dash-header bg-green-800 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          {/* Left: logos + title */}
          <div className="flex items-center gap-2 min-w-0">
            <img src="/cvsu-logo.png" alt="CvSU" className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm leading-tight truncate">CAVITE STATE UNIVERSITY</p>
              <p className="text-green-300 text-[10px] sm:text-xs truncate">Imus Campus — OJT DTR System</p>
            </div>
          </div>
          {/* Right: dark mode + sign out */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleDark}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-700 hover:bg-green-600 active:bg-green-500 text-white transition-colors"
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
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Student Info Card */}
        <div className="dash-card bg-white dark:bg-gray-800 rounded-xl shadow p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
            <p className="font-bold text-green-800 dark:text-green-400">{profile?.full_name || user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Student ID</p>
            <p className="font-semibold text-green-800 dark:text-green-400">{profile?.student_id || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Program / Course</p>
            <p className="font-semibold text-green-800 dark:text-green-400">{profile?.program} — {profile?.course_code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Academic Year</p>
            <p className="font-semibold text-green-800 dark:text-green-400">A.Y. {academicYear} · {semester} Sem</p>
          </div>
        </div>

        {/* Print DTR Settings Card */}
        <div className="dash-card bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-green-800 dark:text-green-400">Print DTR Settings</h3>
            {!editing ? (
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-semibold border border-green-300 dark:border-green-700 hover:border-green-600 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Edit2 size={12} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1 text-xs bg-green-700 hover:bg-green-800 text-white font-semibold px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Check size={12} /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 border border-gray-300 dark:border-gray-600 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Supervisor / Head of Agency</p>
                <p className="font-semibold text-green-800 dark:text-green-400">{supervisor}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Academic Year</p>
                <p className="font-semibold text-green-800 dark:text-green-400">{academicYear}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Semester</p>
                <p className="font-semibold text-green-800 dark:text-green-400">{semester} Semester</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Supervisor / Head of Agency</label>
                <input
                  type="text"
                  value={draftSupervisor}
                  onChange={e => setDraftSupervisor(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Academic Year (e.g. 2025 - 2026)</label>
                <input
                  type="text"
                  value={draftAY}
                  onChange={e => setDraftAY(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Semester</label>
                <select
                  value={draftSemester}
                  onChange={e => setDraftSemester(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
      </main>
    </div>
  )
}
