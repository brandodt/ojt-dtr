import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const PROGRAMS = ['BSIT', 'BSCS', 'BSCE', 'BSEE', 'BSME', 'BSBA', 'BSED', 'BSHRM', 'BSN', 'Other']
const COURSE_CODES = ['ITEC 199', 'CS 199', 'OJT 1', 'OJT 2', 'Practicum']

export default function Register({ onSwitchToLogin }) {
  const { signUp } = useAuth()
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
    program: 'BSIT',
    courseCode: 'ITEC 199',
    totalHours: 486,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'totalHours' ? Number(value) : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signUp(form)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 text-sm mb-6">
            Account created! You can now sign in with your Student ID.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="bg-green-700 hover:bg-green-800 active:bg-green-900 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/cvsu-logo.png" alt="CvSU Logo" className="h-14 w-auto" />
          <div className="text-center">
            <h1 className="text-green-800 font-bold text-base leading-tight">CAVITE STATE UNIVERSITY</h1>
            <p className="text-green-700 text-xs">Imus Campus — OJT DTR System</p>
          </div>
          <img src="/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" className="h-14 w-auto" />
        </div>

        <h2 className="text-xl font-bold text-green-800 text-center mb-5">Create Account</h2>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-green-800 mb-1">Full Name (Last, First M.)</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="DELA TORRE, JUAN D."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-green-800 mb-1">Student ID</label>
            <input
              type="text"
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              required
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="2022-XXXXX"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Program</label>
              <select
                name="program"
                value={form.program}
                onChange={handleChange}
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Course Code</label>
              <select
                name="courseCode"
                value={form.courseCode}
                onChange={handleChange}
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {COURSE_CODES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-green-800 mb-1">Required OJT Hours</label>
            <input
              type="number"
              name="totalHours"
              value={form.totalHours}
              onChange={handleChange}
              min={1}
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 active:bg-green-900 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-green-700 font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
