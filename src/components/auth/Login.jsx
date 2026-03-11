import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Login({ onSwitchToRegister }) {
  const { signIn } = useAuth()
  const [form, setForm] = useState({ studentId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/cvsu-logo.png" alt="CvSU Logo" className="h-16 w-auto" />
          <div className="text-center">
            <h1 className="text-green-800 font-bold text-lg leading-tight">CAVITE STATE UNIVERSITY</h1>
            <p className="text-green-700 text-sm">Imus Campus</p>
            <p className="text-yellow-600 font-semibold text-sm">OJT DTR System</p>
          </div>
          <img src="/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" className="h-16 w-auto" />
        </div>

        <h2 className="text-2xl font-bold text-green-800 text-center mb-6">Sign In</h2>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-800 mb-1">Student ID</label>
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
          <div>
            <label className="block text-sm font-medium text-green-800 mb-1">Password</label>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 active:bg-green-900 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          No account yet?{' '}
          <button onClick={onSwitchToRegister} className="text-green-700 font-semibold hover:underline">
            Register here
          </button>
        </p>
      </div>
    </div>
  )
}
