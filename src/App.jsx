import { useState } from 'react'
import { Settings } from 'react-feather'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/dashboard/Dashboard'
import { isConfigured } from './lib/supabase'

function AppContent() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('login') // 'login' | 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-green-800 text-lg font-semibold animate-pulse">Loading…</div>
      </div>
    )
  }

  if (user) return <Dashboard />

  if (page === 'register') return <Register onSwitchToLogin={() => setPage('login')} />
  return <Login onSwitchToRegister={() => setPage('register')} />
}

function SetupScreen() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/cvsu-logo.png" alt="CvSU Logo" className="h-16 w-auto" />
          <div className="text-center">
            <h1 className="text-green-800 font-bold text-lg">CAVITE STATE UNIVERSITY</h1>
            <p className="text-green-700 text-sm">Imus Campus — OJT DTR System</p>
          </div>
          <img src="/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" className="h-16 w-auto" />
        </div>
        <div className="bg-yellow-50 border border-yellow-400 rounded-xl p-5 mb-4">
          <h2 className="text-yellow-800 font-bold text-base mb-2 flex items-center gap-2"><Settings size={16} /> Supabase Setup Required</h2>
          <p className="text-yellow-700 text-sm mb-3">Open <code className="bg-yellow-100 px-1 rounded">.env.local</code> and fill in your Supabase credentials:</p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto">{`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your_anon_key_here`}</pre>
        </div>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>Go to <span className="font-semibold text-green-700">supabase.com</span> → create a free project</li>
          <li>Copy your <span className="font-semibold">Project URL</span> and <span className="font-semibold">anon public key</span> from Project Settings → API</li>
          <li>Run the SQL in <code className="bg-gray-100 px-1 rounded">supabase_schema.sql</code> in the Supabase SQL Editor</li>
          <li>Paste the values into <code className="bg-gray-100 px-1 rounded">.env.local</code> and restart the dev server</li>
        </ol>
      </div>
    </div>
  )
}

export default function App() {
  if (!isConfigured) return <SetupScreen />
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

