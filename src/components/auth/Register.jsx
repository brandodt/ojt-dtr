import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useAuth } from '../../context/AuthContext'

const PROGRAMS = ['BSIT', 'BSCS', 'BSCE', 'BSEE', 'BSME', 'BSBA', 'BSED', 'BSHRM', 'BSN', 'Other']
const COURSE_CODES = ['ITEC 199', 'CS 199', 'OJT 1', 'OJT 2', 'Practicum']

// Animated SVG checkmark that draws itself in
function SuccessCheck() {
  const svgRef = useRef()
  useGSAP(() => {
    const circle = svgRef.current.querySelector('.sc-circle')
    const check = svgRef.current.querySelector('.sc-path')
    const circLen = 2 * Math.PI * 24   // ≈ 150.8
    const checkLen = check.getTotalLength()

    gsap.set(circle, { attr: { 'stroke-dasharray': circLen, 'stroke-dashoffset': circLen } })
    gsap.set(check, { attr: { 'stroke-dasharray': checkLen, 'stroke-dashoffset': checkLen } })

    const tl = gsap.timeline({ delay: 0.15 })
    tl
      .from(svgRef.current, { scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(2)' })
      .to(circle, { attr: { 'stroke-dashoffset': 0 }, duration: 0.65, ease: 'power2.out' }, '-=0.2')
      .to(check, { attr: { 'stroke-dashoffset': 0 }, duration: 0.45, ease: 'power2.out' }, '-=0.3')
  }, { scope: svgRef })

  return (
    <svg ref={svgRef} viewBox="0 0 52 52" className="w-24 h-24 mx-auto mb-4" style={{ transformOrigin: 'center' }}>
      <circle className="sc-circle" cx="26" cy="26" r="24" fill="none" stroke="#16a34a" strokeWidth="2.5" />
      <path className="sc-path" fill="none" stroke="#16a34a" strokeWidth="3.2"
        strokeLinecap="round" strokeLinejoin="round" d="M14 27 L22 35 L38 18" />
    </svg>
  )
}

export default function Register({ onSwitchToLogin }) {
  const { signUp } = useAuth()
  const [form, setForm] = useState({
    password: '', confirmPassword: '', fullName: '', studentId: '',
    program: 'BSIT', courseCode: 'ITEC 199', totalHours: 486,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const formContainerRef = useRef()
  const submitBtnRef = useRef()

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl
      .from('.reg-card', { y: 60, opacity: 0, scale: 0.9, duration: 0.75, ease: 'back.out(1.5)' })
      .from(['.reg-logo-l', '.reg-logo-r'], { y: -28, opacity: 0, scale: 0.5, stagger: 0.13, duration: 0.55, ease: 'back.out(2.5)' }, '-=0.5')
      .from('.reg-center-text', { opacity: 0, y: 12, duration: 0.38 }, '-=0.35')
      .from('.reg-title', { opacity: 0, y: 10, scale: 0.94, duration: 0.35 }, '-=0.2')
      .from('.reg-field', { opacity: 0, x: -24, stagger: 0.08, duration: 0.38 }, '-=0.15')
      .from('.reg-btn', { opacity: 0, y: 14, scale: 0.88, duration: 0.4, ease: 'back.out(2)' }, '-=0.05')
      .from('.reg-footer', { opacity: 0, duration: 0.3 }, '-=0.05')
  }, { scope: formContainerRef, dependencies: [success] })

  // Callback ref on error div — animates entrance + shake on each mount
  const errorAnimRef = (el) => {
    if (!el) return
    gsap.from(el, { opacity: 0, y: -10, duration: 0.28, ease: 'power2.out' })
    gsap.to(el, {
      delay: 0.22,
      keyframes: [
        { x: -8, duration: 0.07 }, { x: 8, duration: 0.07 },
        { x: -5, duration: 0.06 }, { x: 5, duration: 0.06 },
        { x: 0, duration: 0.08 },
      ],
    })
  }

  // Success screen callback ref animation
  const successAnimRef = (el) => {
    if (!el) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl
      .from(el.querySelector('.success-inner'), { scale: 0.82, opacity: 0, y: 30, duration: 0.6, ease: 'back.out(1.7)' })
      .from(el.querySelectorAll('.success-text'), { opacity: 0, y: 16, stagger: 0.1, duration: 0.4 }, '-=0.15')
      .from(el.querySelector('.success-btn'), { opacity: 0, y: 10, scale: 0.86, duration: 0.42, ease: 'back.out(2)' }, '-=0.1')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === 'totalHours' ? Number(value) : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    gsap.to(submitBtnRef.current, { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.inOut' })
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
      <div
        ref={successAnimRef}
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #bbf7d0 100%)' }}
      >
        <div className="success-inner bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <SuccessCheck />
          <h2 className="success-text text-2xl font-bold text-green-800 mb-2">Registration Successful!</h2>
          <p className="success-text text-gray-600 text-sm mb-6">
            Account created! You can now sign in with your Student ID.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="success-btn bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors shadow-md"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={formContainerRef}
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #bbf7d0 100%)' }}
    >
      <div className="reg-card bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/cvsu-logo.png" alt="CvSU Logo" className="reg-logo-l h-14 w-auto" />
          <div className="reg-center-text text-center">
            <h1 className="text-green-800 font-bold text-base leading-tight">CAVITE STATE UNIVERSITY</h1>
            <p className="text-green-700 text-xs">Imus Campus — OJT DTR System</p>
          </div>
          <img src="/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" className="reg-logo-r h-14 w-auto" />
        </div>

        <h2 className="reg-title text-xl font-bold text-green-800 text-center mb-5">Create Account</h2>

        {error && (
          <div ref={errorAnimRef} className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="reg-field">
            <label className="block text-xs font-medium text-green-800 mb-1">Full Name (Last, First M.)</label>
            <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="DELA TORRE, JUAN D." />
          </div>
          <div className="reg-field">
            <label className="block text-xs font-medium text-green-800 mb-1">Student ID</label>
            <input type="text" name="studentId" value={form.studentId} onChange={handleChange} required
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="2022-XXXXX" />
          </div>
          <div className="reg-field grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Program</label>
              <select name="program" value={form.program} onChange={handleChange}
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Course Code</label>
              <select name="courseCode" value={form.courseCode} onChange={handleChange}
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {COURSE_CODES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="reg-field">
            <label className="block text-xs font-medium text-green-800 mb-1">Required OJT Hours</label>
            <input type="number" name="totalHours" value={form.totalHours} onChange={handleChange} min={1}
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="reg-field grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-medium text-green-800 mb-1">Confirm Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required
                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••" />
            </div>
          </div>

          <button ref={submitBtnRef} type="submit" disabled={loading}
            className="reg-btn w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 shadow-md mt-1">
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="reg-footer text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-green-700 font-semibold hover:underline">Sign in</button>
        </p>
      </div>
    </div>
  )
}
