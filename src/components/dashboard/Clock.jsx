import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function Clock() {
  const [now, setNow] = useState(new Date())
  const secRef = useRef()
  const prevSecRef = useRef(now.getSeconds())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Flip animation on each new second
  useEffect(() => {
    const s = now.getSeconds()
    if (s !== prevSecRef.current && secRef.current) {
      prevSecRef.current = s
      gsap.fromTo(secRef.current,
        { y: -8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' }
      )
    }
  }, [now])

  const h = now.getHours() % 12 || 12
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM'
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="bg-green-800 text-white rounded-xl p-5 text-center shadow">
      <p className="text-green-200 text-sm mb-1">{dateStr}</p>
      <p className="text-4xl font-bold tracking-widest font-mono">
        {h}:{m}:<span ref={secRef} className="inline-block">{s}</span>
        <span className="text-2xl ml-2 font-semibold text-green-300">{ampm}</span>
      </p>
    </div>
  )
}
