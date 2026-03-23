import { useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useAuth } from '../../context/AuthContext'

function hasRecoveryHash() {
  const raw = window.location.hash.replace(/^#/, '')
  const params = new URLSearchParams(raw)
  return params.get('type') === 'recovery' || params.has('access_token')
}

export default function ForgotPassword({ onBackToLogin }) {
  const { sendPasswordReset, updatePassword, signOut, isPasswordRecovery } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const containerRef = useRef()
  const submitBtnRef = useRef()

  const isResetMode = useMemo(() => isPasswordRecovery || hasRecoveryHash(), [isPasswordRecovery])

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl
      .from('.fp-card', { y: 62, opacity: 0, scale: 0.9, duration: 0.8, ease: 'back.out(1.7)' })
      .from('.fp-logo', { y: -30, opacity: 0, scale: 0.5, stagger: 0.12, duration: 0.52, ease: 'back.out(2.2)' }, '-=0.5')
      .from('.fp-heading', { opacity: 0, y: 12, duration: 0.38 }, '-=0.2')
      .from('.fp-field', { opacity: 0, x: -20, stagger: 0.08, duration: 0.36 }, '-=0.12')
      .from('.fp-btn', { opacity: 0, y: 14, scale: 0.9, duration: 0.36, ease: 'back.out(2)' }, '-=0.08')
      .from('.fp-footer', { opacity: 0, duration: 0.3 }, '-=0.05')
  }, { scope: containerRef, dependencies: [isResetMode] })

  const errorAnimRef = (el) => {
    if (!el) return
    gsap.from(el, { opacity: 0, y: -10, duration: 0.28, ease: 'power2.out' })
    gsap.to(el, {
      delay: 0.2,
      keyframes: [
        { x: -8, duration: 0.07 },
        { x: 8, duration: 0.07 },
        { x: -5, duration: 0.06 },
        { x: 5, duration: 0.06 },
        { x: 0, duration: 0.08 },
      ],
    })
  }

  const handleSendReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    gsap.to(submitBtnRef.current, { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut' })
    setLoading(true)
    try {
      await sendPasswordReset(identifier)
      setSuccessMessage('If account exists, a reset link was sent.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    gsap.to(submitBtnRef.current, { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut' })
    setLoading(true)
    try {
      await updatePassword(password)
      await signOut()
      window.location.hash = ''
      setSuccessMessage('Password updated successfully. Please sign in again.')
      setTimeout(() => {
        onBackToLogin()
      }, 600)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #bbf7d0 100%)' }}
    >
      <div className="fp-card bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/cvsu-logo.png" alt="CvSU Logo" className="fp-logo h-14 w-auto" />
          <div className="text-center">
            <h1 className="text-green-800 font-bold text-base leading-tight">CAVITE STATE UNIVERSITY</h1>
            <p className="text-green-700 text-xs">Imus Campus — OJT DTR System</p>
          </div>
          <img src="/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" className="fp-logo h-14 w-auto" />
        </div>

        <h2 className="fp-heading text-2xl font-bold text-green-800 text-center mb-2">
          {isResetMode ? 'Set New Password' : 'Forgot Password'}
        </h2>
        <p className="fp-heading text-sm text-gray-600 text-center mb-6">
          {isResetMode
            ? 'Enter your new password below.'
            : 'Enter your Student ID or Email to receive a password reset link.'}
        </p>

        {error && (
          <div ref={errorAnimRef} className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-300 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {successMessage}
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleSendReset} className="space-y-4">
            <div className="fp-field">
              <label className="block text-sm font-medium text-green-800 mb-1">Student ID or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="2022XXXXX or name@cvsu.edu.ph"
              />
            </div>
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={loading}
              className="fp-btn w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 shadow-md"
            >
              {loading ? 'Sending reset link…' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="fp-field">
              <label className="block text-sm font-medium text-green-800 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
            <div className="fp-field">
              <label className="block text-sm font-medium text-green-800 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={loading}
              className="fp-btn w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 shadow-md"
            >
              {loading ? 'Updating password…' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="fp-footer text-center text-sm text-gray-600 mt-6">
          Back to{' '}
          <button onClick={onBackToLogin} className="text-green-700 font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}
