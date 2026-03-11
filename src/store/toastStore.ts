import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: ToastMessage[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

let toastId = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = `toast-${++toastId}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    // 自动移除
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 3000)
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
