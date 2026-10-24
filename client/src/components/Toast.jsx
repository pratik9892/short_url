import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { IconAlert, IconCheck, IconInfo } from './ui/Icons'
import './Toast.css'

const ToastContext = createContext(null)

const ICONS = {
  success: IconCheck,
  error: IconAlert,
  info: IconInfo,
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timers = useRef({})

  const show = useCallback((message, type = 'info') => {
    clearTimeout(timers.current.leave)
    clearTimeout(timers.current.remove)
    setToast({ message, type, id: Date.now(), leaving: false })
    // mark as leaving first so the exit animation can play, then unmount
    timers.current.leave = setTimeout(() => setToast((t) => (t ? { ...t, leaving: true } : t)), 2600)
    timers.current.remove = setTimeout(() => setToast(null), 2900)
  }, [])

  const value = useMemo(() => ({ show }), [show])
  const Icon = toast ? ICONS[toast.type] || IconInfo : null

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toast && (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}${toast.leaving ? ' is-leaving' : ''}`}
            role="status"
          >
            <span className="toast__icon">
              <Icon size={14} />
            </span>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
