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
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/cvsu-logo.png" alt="CvSU" className="h-10 w-auto" />
            <div>
              <p className="font-bold text-sm leading-tight">CAVITE STATE UNIVERSITY</p>
              <p className="text-green-300 text-xs">Imus Campus — OJT DTR System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img src="/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" className="h-10 w-auto" />
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
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
