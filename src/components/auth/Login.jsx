import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useAuth } from '../../context/AuthContext'

export default function Login({ onSwitchToRegister, onSwitchToForgotPassword }) {
  const { signIn } = useAuth()
  const [form, setForm] = useState({ studentId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const containerRef = useRef()
  const submitBtnRef = useRef()
  const forgotBtnRef = useRef()
  const registerBtnRef = useRef()

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl
      .from('.login-card', { y: 70, opacity: 0, scale: 0.88, duration: 0.8, ease: 'back.out(1.6)' })
      .from('.login-logo-l', { y: -35, opacity: 0, scale: 0.5, duration: 0.6, ease: 'back.out(2.5)' }, '-=0.55')
      .from('.login-logo-r', { y: -35, opacity: 0, scale: 0.5, duration: 0.6, ease: 'back.out(2.5)' }, '-=0.5')
      .from('.login-center-text', { opacity: 0, y: 14, duration: 0.4 }, '-=0.38')
      .from('.login-title', { opacity: 0, y: 12, scale: 0.94, duration: 0.38 }, '-=0.22')
      .from('.login-field', { opacity: 0, x: -28, stagger: 0.1, duration: 0.42 }, '-=0.18')
        .from('.login-forgot', { opacity: 0, x: 18, duration: 0.32 }, '-=0.12')
      .from('.login-btn', { opacity: 0, y: 16, scale: 0.88, duration: 0.42, ease: 'back.out(2)' }, '-=0.1')
      .from('.login-footer', { opacity: 0, duration: 0.35 }, '-=0.08')
  }, { scope: containerRef })

  // Callback ref fires when error element mounts → plays slide + shake
  const errorAnimRef = (el) => {
    if (!el) return
    gsap.from(el, { opacity: 0, y: -10, duration: 0.28, ease: 'power2.out' })
    gsap.to(el, {
      delay: 0.22,
      keyframes: [
        { x: -8, duration: 0.07 },
        { x: 8, duration: 0.07 },
        { x: -5, duration: 0.06 },
        { x: 5, duration: 0.06 },
        { x: 0, duration: 0.08 },
      ],
    })
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    gsap.to(submitBtnRef.current, { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut' })
    setLoading(true)
    try {
      await signIn(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const animateAndSwitch = (targetRef, onSwitch) => {
    gsap.to(targetRef.current, { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut' })
    gsap.to('.login-card', {
      opacity: 0,
      y: 20,
      scale: 0.97,
      duration: 0.22,
      ease: 'power2.inOut',
      onComplete: onSwitch,
    })
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #bbf7d0 100%)' }}
    >
      <div className="login-card bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/cvsu-logo.png" alt="CvSU Logo" className="login-logo-l h-16 w-auto" />
          <div className="login-center-text text-center">
            <h1 className="text-green-800 font-bold text-lg leading-tight">CAVITE STATE UNIVERSITY</h1>
            <p className="text-green-700 text-sm">Imus Campus</p>
            <p className="text-yellow-600 font-semibold text-sm">OJT DTR System</p>
          </div>
          <img src="/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" className="login-logo-r h-16 w-auto" />
        </div>

        <h2 className="login-title text-2xl font-bold text-green-800 text-center mb-6">Sign In</h2>

        {error && (
          <div ref={errorAnimRef} className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="login-field">
            <label className="block text-sm font-medium text-green-800 mb-1">Student ID</label>
            <input
              type="text" name="studentId" value={form.studentId} onChange={handleChange} required
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="2022XXXXX"
            />
          </div>
          <div className="login-field">
            <label className="block text-sm font-medium text-green-800 mb-1">Password</label>
            <input
              type="password" name="password" value={form.password} onChange={handleChange} required
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          <div className="login-forgot text-right -mt-2">
            <button
              ref={forgotBtnRef}
              type="button"
              onClick={() => animateAndSwitch(forgotBtnRef, onSwitchToForgotPassword)}
              className="text-sm text-green-700 font-medium hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <button
            ref={submitBtnRef}
            type="submit"
            disabled={loading}
            className="login-btn w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 shadow-md"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer text-center text-sm text-gray-600 mt-6">
          No account yet?{' '}
          <button
            ref={registerBtnRef}
            onClick={() => animateAndSwitch(registerBtnRef, onSwitchToRegister)}
            className="text-green-700 font-semibold hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  )
}
