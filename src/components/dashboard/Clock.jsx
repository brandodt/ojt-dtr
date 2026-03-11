import { useEffect, useState } from 'react'

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="bg-green-800 text-white rounded-xl p-5 text-center shadow">
      <p className="text-green-200 text-sm mb-1">{dateStr}</p>
      <p className="text-4xl font-bold tracking-widest font-mono">{timeStr}</p>
    </div>
  )
}
