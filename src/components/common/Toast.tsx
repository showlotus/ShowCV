import { memo } from 'react'
import { useToastStore } from '@/store/toastStore'
import { Check, X, Info } from 'lucide-react'

export const Toast = memo(() => {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-up flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{
            background: toast.type === 'success' ? 'var(--success)' :
                       toast.type === 'error' ? 'var(--danger)' :
                       'var(--accent)',
            color: toast.type === 'success' || toast.type === 'error' ? '#fff' : '#000',
          }}
        >
          {toast.type === 'success' && <Check className="w-4 h-4" />}
          {toast.type === 'error' && <X className="w-4 h-4" />}
          {toast.type === 'info' && <Info className="w-4 h-4" />}
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
})

Toast.displayName = 'Toast'
