import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Clock from './Clock'
import TimeInOut from './TimeInOut'
import DTRTable from './DTRTable'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [refresh, setRefresh] = useState(0)

  const currentYear = new Date().getFullYear()
  const ay = `${currentYear} - ${currentYear + 1}`

  return (
    <div className="min-h-screen bg-green-50">
      {/* Top Nav */}
      <header className="bg-green-800 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          {/* Left: logos + title */}
          <div className="flex items-center gap-2 min-w-0">
            <img src="/cvsu-logo.png" alt="CvSU" className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm leading-tight truncate">CAVITE STATE UNIVERSITY</p>
              <p className="text-green-300 text-[10px] sm:text-xs truncate">Imus Campus — OJT DTR System</p>
            </div>
          </div>
          {/* Right: bagong pilipinas + sign out */}
          <div className="flex items-center gap-2 shrink-0">
            <img src="/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" className="h-9 w-auto" />
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Student Info Card */}
        <div className="bg-white rounded-xl shadow p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="font-bold text-green-800">{profile?.full_name || user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Student ID</p>
            <p className="font-semibold text-green-800">{profile?.student_id || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Program / Course</p>
            <p className="font-semibold text-green-800">{profile?.program} — {profile?.course_code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Academic Year</p>
            <p className="font-semibold text-green-800">A.Y. {ay} · 2nd Sem</p>
          </div>
        </div>

        {/* Clock */}
        <Clock />

        {/* Time In / Out */}
        <TimeInOut onRecordSaved={() => setRefresh(r => r + 1)} />

        {/* DTR Table */}
        <DTRTable refresh={refresh} />
      </main>
    </div>
  )
}
