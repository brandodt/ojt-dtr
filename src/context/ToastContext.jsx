import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timerMap = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350)
  }, [])

  const showToast = useCallback((type, text, duration = 4500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, text, leaving: false }])
    timerMap.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '360px' }}>
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  const isSuccess = toast.type === 'success'
  const isError = toast.type === 'error'

  const base = 'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300'
  const color = isSuccess
    ? 'bg-green-50 border-green-300 text-green-800'
    : isError
      ? 'bg-red-50 border-red-300 text-red-700'
      : 'bg-blue-50 border-blue-300 text-blue-800'
  const opacity = toast.leaving ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'

  const icon = isSuccess ? '✓' : isError ? '✕' : 'ℹ'
  const iconColor = isSuccess ? 'text-green-600' : isError ? 'text-red-500' : 'text-blue-600'

  return (
    <div className={`${base} ${color} ${opacity}`}>
      <span className={`shrink-0 font-bold text-base leading-none mt-0.5 ${iconColor}`}>{icon}</span>
      <span className="flex-1 leading-snug">{toast.text}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity leading-none mt-0.5"
      >
        ✕
      </button>
    </div>
  )
}
